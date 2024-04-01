const audioContext = new(window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const chartContainer = document.getElementById('chartContainer');
const canvas = chartContainer;
const ctx = document.getElementById('chartContainer').getContext('2d');
const bufferLength = analyser.frequencyBinCount;
let data = [];
let myChart;
let arr1 = [];
let filterArr = [];
let files = [];
let isCSV = false;
let xArray = []
let yArray = []

let x = 0;
const selectedData = new Float32Array(bufferLength);
const sliceWidth = chartContainer ? chartContainer.clientWidth * 1.0 / bufferLength : 0; // Calculate sliceWidth if canvas exists
let audioBuffers = [];
let dataPoints = [];

// Function to handle audio processing and visualization
function processAndVisualize(arrayBuffer, fileIndex) {

    audioContext.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
            analyzeAmplitude(audioBuffer);
            audioBuffers[fileIndex] = audioBuffer;
            if (fileIndex === 0) { // Automatically visualize the first file
                updateChart(fileIndex);
            }

        })
        .catch(error => {
            console.error('Error decoding audio:', error);
        });
}

// Function to process CSV file and update chart
function processCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const [xArr, yArr, arr] = parseCsvContent(content); // Implement this function based on your CSV format
        // Use xArray and yArray to update the chart data
        dataPoints = xArr.map((x, index) => ({ x, y: yArr[index] }));
        console.log("psf dataPoints", dataPoints)
        console.log("psf arr", arr)
        xArray = xArr
        yArray = yArr
        arr1 = arr
        console.log("psf arr1", arr1)
            // if (index == 0) {
            //     updateChart(index);
            // }
            // Optionally use arr1 to position vertical lines
        isCSV = true;
        initializeChart(); // You may need to adjust this function to accept data
    };
    reader.readAsText(file);
}

// Example CSV parsing function (simplified and needs to be adapted)
function parseCsvContent(content) {
    let lines = content.split('\n').filter(line => line);
    // Assuming CSV format: xValue,yValue
    let xArray = [],
        yArray = [],
        arr1 = []; // Example arrays
    for (let i = 1; i < lines.length; i++) { // Starting from 1 to skip header
        let [x, y, arrValue] = lines[i].split(',').map(Number);
        xArray.push(x);
        yArray.push(y);
        arr1.push(arrValue || null); // Assuming third column for vertical lines (optional)
    }
    console.log("psv: ", xArray, yArray, arr1)
    return [xArray, yArray, arr1];
}


function saveArraysAsCsv(xArray, yArray, arr1) {
    // Start with the column headers
    let csvContent = "xArray,yArray,arr1\n";

    // Determine the longest array
    const maxLength = Math.max(xArray.length, yArray.length, filterArr.length);
    for (let i = 0; i < maxLength; i++) {
        const xValue = xArray[i] || '';
        const yValue = yArray[i] || '';
        const arr1Value = filterArr[i] || '';
        csvContent += `${xValue},${yValue},${arr1Value}\n`; // Append row data
    }

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "data.csv"); // Specify the file name
    document.body.appendChild(link); // Required for FF
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
}

function analyzeAmplitude(audioBuffer) {
    x = 0;
    data = [];
    dataPoints = [];
    yArray = []
    xArray = []
    const audioLength = audioBuffer.length;
    var interval = audioLength / bufferLength;
    let y = 0;

    for (let i = 0; i < bufferLength; i++) {
        const sampleIndex = Math.floor(i * interval);
        const channelData = audioBuffer.getChannelData(1);

        if (sampleIndex >= 0 && sampleIndex < channelData.length) {
            const sampleValue = channelData[sampleIndex];
            selectedData[i] = sampleValue;
        }
        y = selectedData[i];

        x += sliceWidth;
        console.log("1c", x, y)

        xArray.push(x)
        yArray.push(y)

        dataPoints.push({
            x: x,
            y: y
        });
        console.log("1d", xArray, yArray)
    }

    var dataSeries = {
        type: "spline"
    };

    dataSeries.dataPoints = dataPoints;
    data.push(dataSeries);
}

function updateChart(fileIndex) {
    const file = files[fileIndex]; // Assuming 'files' is accessible and contains the uploaded files
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Handle CSV file processing
        processCsvFile(file);
    } else {
        // Assuming it's an audio file if not CSV
        const audioBuffer = audioBuffers[fileIndex];
        console.log("audioBuffers: ", audioBuffer)
        if (audioBuffer) {
            analyzeAmplitude(audioBuffer);
            initializeChart(); // Make sure audioBuffer is defined
        } else {
            console.error('No audio data available for analysis');
        }
    }
}

function getRandomSubarray(arr, size) {
    let shuffled = arr.slice(0),
        i = arr.length,
        temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[i];
        shuffled[i] = shuffled[index];
        shuffled[index] = temp;
    }
    return shuffled.slice(0, size);
}

function initializeChart() {
    filterArr = arr1;
    console.log("IC:, isCSV ", arr1, isCSV);
    filterArr = filterArr.filter(value => value !== null);
    if (!isCSV) {

        filterArr = getRandomSubarray(xArray, 10);
    }

    filterArr.sort((a, b) => a - b);
    console.log('getRandomSubarray: ', filterArr);

    const annotations = filterArr.map((xValue) => {
        console.log('filterArr, xValue: ', filterArr, xValue)
        console.log('dataPoints: ', dataPoints)
        return {
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: xValue,
            // borderColor: `hsl(${(index * 30) % 360}, 100%, 50%)`,
            // Color variation for visibility
            borderColor: 'red',
            borderWidth: 2,
        };
    });

    console.log("annotations: ", annotations)

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            // labels: xArray, // Assuming xArray is suitable for labels; adjust if necessary
            datasets: [{
                label: 'Amplitude vs Time',
                data: dataPoints, // Your data points
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.5,
            }]
        },
        options: {
            scales: {
                // x: {
                //     type: 'linear',
                //     position: 'bottom',
                // },
                // y: {
                //     beginAtZero: true,
                // }
                xAxes: [{
                    display: true,
                    type: 'linear', // Use a linear scale for the x-axis
                    position: 'bottom',
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                        // Other options here
                    }
                }],

                // xAxes: [{
                // type: 'linear', // Use a linear scale for the x-axis
                // position: 'bottom',
                //     gridLines: {
                //         drawOnChartArea: false
                //     }
                // }],
                // yAxes: [{
                //     gridLines: {
                //         drawOnChartArea: false
                //     }
                // }]
            },
            animation: {
                duration: 200,
            },
            annotation: {
                annotations: annotations
            },
            elements: {
                line: {
                    tension: 0 // Ensures lines are straight
                }
            },
            responsive: true,
            plugins: {
                zoom: {
                    // Enables zooming
                    zoom: {
                        enabled: true, // Enables zooming. This option is actually not necessary since enabling wheel is enough.
                        mode: 'x', // Zoom both the x and y axes
                        drag: false, // Disables drag-to-zoom behavior
                        wheel: {
                            enabled: true, // Enables zooming using the mouse wheel
                        },
                        // pinch: {
                        //     enabled: true // Enables zooming using pinch gestures on touch devices
                        // }
                    },
                    // Enables panning
                    // pan: {
                    //     enabled: true, // Enables panning
                    //     mode: 'xy' // Pans both the x and y axes
                    // }
                }
            }
        }
    });

    setUpEventListeners();
    isCSV = false;
}


let isDragging = false;
let dragLineIndex = null; // Index of the line being dragged

// Function to get the x-axis value based on mouse position
function getXValue(myChart, event) {
    const xAxis = myChart.scales['x-axis-0'];
    const pixelValue = event.offsetX;
    console.log("pixelValue", pixelValue)
    console.log("event", event)
    const xValue = xAxis.getValueForPixel(pixelValue);
    console.log("Xvalue", xValue)
        // Return the precise value instead of rounding
    return xValue;
}

function getClosestLineIndex(myChart, mouseX) {
    const xAxis = myChart.scales['x-axis-0'];
    console.log("xAxis", xAxis)
    let closestIndex = -1;
    let closestDistance = Infinity;

    myChart.options.annotation.annotations.forEach((annotation, index) => {

        if (annotation.type === "line" && annotation.mode === "vertical") {
            const distance = Math.abs(xAxis.getPixelForValue(annotation.value) - mouseX);
            console.log("index: ", index, " annotation.value: ", annotation.value)
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }
    });

    return closestIndex;
}

function setUpEventListeners() {
    // Set up the event listeners on the canvas
    canvas.addEventListener('mousedown', (event) => {

        isDragging = true;
        // Determine which line is closer to the drag start point
        dragLineIndex = getClosestLineIndex(myChart, event.offsetX);
        console.log("md", dragLineIndex)
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging && dragLineIndex !== null) {
            const xValue = getXValue(myChart, event);
            // Update the position of the line being dragged
            myChart.options.annotation.annotations[dragLineIndex].value = xValue;
            console.log("mv", event.offsetX, " dragLineIndex: ", dragLineIndex, "xValue:", xValue)
            console.log("mvb filterArr ", filterArr)
            filterArr[dragLineIndex] = xValue;
            console.log("mva filterArr ", filterArr)
            myChart.update();
        } else {
            // Prevent unnecessary chart updates or data modifications
            return;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        dragLineIndex = null;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        dragLineIndex = null;
    });
}

// Event listener for the dropdown selection change
document.getElementById('fileSelector').addEventListener('change', function() {
    const selectedFileIndex = parseInt(this.value, 10);
    updateChart(selectedFileIndex);
});


if (performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD) {
    window.location.reload();
}


document.getElementById('fileInput').addEventListener('change', function() {
    files = this.files; // Update the global `files` variable with the newly selected files
    const fileSelector = document.getElementById('fileSelector');
    fileSelector.innerHTML = ''; // Clear existing options

    for (let i = 0; i < files.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `File ${i + 1}: ${files[i].name}`; // Custom label with file name
        fileSelector.appendChild(option);
    }
});


// Handle the 'showChartButton' click separately
document.getElementById('showChartButton').addEventListener('click', function() {
    const files = document.getElementById('fileInput').files; // Correctly access the files

    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            // Check if the file is a CSV
            if (files[i].type === 'text/csv' || files[i].name.endsWith('.csv')) {
                processCsvFile(files[i]);
            } else {
                // Process as audio file
                const reader = new FileReader();
                reader.onload = function(e) {
                    processAndVisualize(e.target.result, i); // Process each audio file
                };
                reader.readAsArrayBuffer(files[i]);
            }
        }
    }
});

document.getElementById('reset').addEventListener('click', function() {
    myChart.resetZoom();
});

document.getElementById('saveCsvButton').addEventListener('click', function() {
    saveArraysAsCsv(xArray, yArray, filterArr);
});