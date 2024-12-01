// Parse CSV File
document.getElementById('csvFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                processCSVData(results.data);
            }
        });
    }
});

// Process CSV Data
function processCSVData(data) {
    // Calculate Best Times
    const bestTimes = calculateBestTimes(data);

    // Populate Best Times Table
    document.getElementById('time-5k').textContent = bestTimes['5K'] || 'No data';
    document.getElementById('time-10k').textContent = bestTimes['10K'] || 'No data';
    document.getElementById('time-21k').textContent = bestTimes['21.1K'] || 'No data';

    // Prepare Heart Rate Data
    const heartRateData = prepareHeartRateData(data);
    createHeartRateChart(heartRateData);

    // Prepare Distance Distribution Data
    const distanceDistributionData = prepareDistanceDistribution(data);
    createDistanceChart(distanceDistributionData);

    // Prepare Scatter Data
    const scatterData = prepareScatterData(data);
    create3DScatterPlot(scatterData);
}

// Calculate Best Times
function calculateBestTimes(data) {
    const bestTimes = { '5K': null, '10K': null, '21.1K': null };

    data.forEach(run => {
        const distance = parseFloat(run['Distance']);
        const time = run['Time'];
        if (distance >= 5 && (!bestTimes['5K'] || time < bestTimes['5K'])) bestTimes['5K'] = time;
        if (distance >= 10 && (!bestTimes['10K'] || time < bestTimes['10K'])) bestTimes['10K'] = time;
        if (distance >= 21.1 && (!bestTimes['21.1K'] || time < bestTimes['21.1K'])) bestTimes['21.1K'] = time;
    });

    return bestTimes;
}

// Prepare Distance Distribution Data
function prepareDistanceDistribution(data) {
    const bins = { "0-3": 0, "3-5": 0, "5-10": 0, "10-15": 0, "15+": 0 };

    data.forEach(run => {
        const distance = parseFloat(run['Distance']);
        if (distance < 3) bins["0-3"]++;
        else if (distance < 5) bins["3-5"]++;
        else if (distance < 10) bins["5-10"]++;
        else if (distance < 15) bins["10-15"]++;
        else bins["15+"]++;
    });

    return bins;
}

// Create Distance Distribution Chart
function createDistanceChart(bins) {
    const ctx = document.getElementById('distanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bins),
            datasets: [{
                label: 'Number of Runs',
                data: Object.values(bins),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Distance Range (km)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Runs'
                    }
                }
            }
        }
    });
}

// Prepare Heart Rate Data for Runs >= 10K
function prepareHeartRateData(data) {
    const filteredData = data.filter(run => parseFloat(run['Distance']) >= 10);

    return {
        labels: filteredData.map(run => new Date(run['Date']).toLocaleDateString()),
        datasets: [{
            label: 'Heart Rate (bpm)',
            data: filteredData.map(run => parseInt(run['Avg HR'] || 0)),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
        }]
    };
}

// Create Heart Rate Chart
function createHeartRateChart(heartRateData) {
    const ctx = document.getElementById('heartRateChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: heartRateData,
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date of Run'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Heart Rate (bpm)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Prepare 3D Scatter Data with Tooltips
function prepareScatterData(data) {
    const cleanedData = data.filter(run => {
        const distance = parseFloat(run['Distance']);
        const avgPace = run['Avg Pace'];
        return distance > 0 && avgPace;
    });

    return {
        x: cleanedData.map(run => parseFloat(run['Distance'])),
        y: cleanedData.map(run => {
            const paceParts = run['Avg Pace'].split(':');
            return parseInt(paceParts[0]) + parseInt(paceParts[1]) / 60;
        }),
        z: cleanedData.map(run => parseFloat(run['Avg HR'])),
        type: 'scatter3d',
        mode: 'markers',
        marker: {
            size: 8,
            color: cleanedData.map(run => parseFloat(run['Distance'])),
            colorscale: 'Viridis'
        },
        hovertemplate:
            '<b>Distance (km):</b> %{x}<br>' +
            '<b>Pace (min/km):</b> %{y:.2f}<br>' +
            '<b>Heart Rate (bpm):</b> %{z}<extra></extra>'
    };
}

// Create 3D Scatter Plot
function create3DScatterPlot(scatterData) {
    Plotly.newPlot('scatterPlot', [scatterData], {
        margin: { t: 0 },
        scene: {
            xaxis: { title: 'Distance (km)' },
            yaxis: { title: 'Pace (min/km)' },
            zaxis: { title: 'Average Heart Rate (bpm)' }
        }
    });
}

