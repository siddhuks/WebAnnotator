const audioContext = new(window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;
const chartContainer = document.getElementById('chartContainer');
const canvas = chartContainer;
const ctx = document.getElementById('chartContainer').getContext('2d');
const bufferLength = analyser.frequencyBinCount;
let data = [];
let myChart;

let x = 0;
const selectedData = new Float32Array(bufferLength);
const sliceWidth = chartContainer ? chartContainer.clientWidth * 1.0 / bufferLength : 0; // Calculate sliceWidth if canvas exists
let audioBuffers = [];
let dataPoints = [];

// Function to handle audio processing and visualization
function processAndVisualize(arrayBuffer, fileIndex) {

    audioContext.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
            //analyzeAmplitude(audioBuffer);
            audioBuffers[fileIndex] = audioBuffer;
            if (fileIndex === 0) { // Automatically visualize the first file
                updateChart(fileIndex);
            }

        })
        .catch(error => {
            console.error('Error decoding audio:', error);
        });
}

document.getElementById('reset').addEventListener('click', function() {
    myChart.resetZoom();
});


// Function to update the chart based on the selected file
// Assuming the rest of your script remains unchanged

// let verticalLinesPositions = []; // Example positions for vertical lines

// function createVerticalLineDataset(xPosition) {
//     return {
//         label: '',
//         data: [{ x: xPosition, y: -1 }, { x: xPosition, y: 1 }],
//         borderColor: 'rgb(255, 99, 132)', // Use different colors if needed
//         borderWidth: 2,
//         pointRadius: 0,
//         dragData: true, // Enable dragging if you want the lines to be draggable
//     };
// }

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

// Use the function to get 10 random values from xArray


// arr now contains 10 random values from xArray


function initializeChart() {
    let arr = [100, 200, 300, 400, 500]
        // Dynamically generate annotations from xArray
    let arr1 = getRandomSubarray(xArray, 10);
    console.log('getRandomSubarray: ', arr1);
    const annotations = arr1.map((xValue) => {
        console.log('xArray, xValue: ', arr1, xValue)
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
                        mode: 'xy', // Zoom both the x and y axes
                        // drag: false, // Disables drag-to-zoom behavior
                        wheel: {
                            enabled: true, // Enables zooming using the mouse wheel
                        },
                        pinch: {
                            enabled: true // Enables zooming using pinch gestures on touch devices
                        }
                    },
                    // Enables panning
                    pan: {
                        enabled: true, // Enables panning
                        mode: 'xy' // Pans both the x and y axes
                    }
                }
            }
        }
    });
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
            console.log("mv", event.offsetX)
            myChart.update();
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


function updateChart(fileIndex) {
    const audioBuffer = audioBuffers[fileIndex];
    analyzeAmplitude(audioBuffer); // Ensure this updates `data` correctly

    initializeChart();
    // if (window.myChart instanceof Chart) {
    //     window.myChart.destroy(); // Destroy the previous instance if exists
    // }

    // Define initial position for the vertical line (for example, middle of the chart)
    // const verticalLineX = Math.max(...dataPoints.map(dp => dp.x)) / 2;
    setUpEventListeners();
}

// document.addEventListener("DOMContentLoaded", function() {
//     // Your chart initialization code here
//     if (typeof Chart !== 'undefined') {
//         initializeChart();
//     } else {
//         console.error('Chart.js not loaded');
//     }
// });

// function initializeChart() {
//     // Initialization code for your chart
// }



// Event listener for the dropdown selection change
document.getElementById('fileSelector').addEventListener('change', function() {
    const selectedFileIndex = parseInt(this.value, 10);
    updateChart(selectedFileIndex);
});


if (performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD) {
    window.location.reload();
}


document.getElementById('fileInput').addEventListener('change', function() {
    const files = this.files; // Access the selected files
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
            const reader = new FileReader();
            reader.onload = function(e) {
                processAndVisualize(e.target.result, i); // Process each file
            };
            reader.readAsArrayBuffer(files[i]);
        }
    }
});

var xArray = []
var yArray = []

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














// plugins: {
//     // dragData: {
//     //     round: 1,
//     //     dragX: true,
//     //     dragY: true,
//     //     onDragstart: (event) => {
//     //         console.log(event)
//     //     },
//     //     onDrag: function(e, datasetIndex, index, value) {
//     //         console.log("OnDrag", window.myChart.data.datasets[0])
//     //         console.log("OnDrag1", window.myChart.data.datasets[1])
//     //         console.log("Dragging", datasetIndex, index, value);
//     //         if (index === 1) { // Check if the dragged dataset is the vertical line
//     //             console.log("Dragging222222", datasetIndex, index, value);
//     //             window.myChart.data.datasets[1].data[0].x = value.x; // Adjust both points to keep the line vertical
//     //             window.myChart.data.datasets[1].data[1].x = value.x;
//     //             window.myChart.update();
//     //         }
//     //     },
//     //     onDragEnd: function(e, datasetIndex, index, value) {
//     //         console.log('Drag End', value);
//     //     },
//     // },


//     zoom: {
//         zoom: {
//             wheel: {
//                 enabled: true,
//             },
//             pinch: {
//                 enabled: true,
//             },
//             mode: 'xy',
//         },
//         pan: {
//             enabled: true,
//             mode: 'xy',
//         },
//     }
// }