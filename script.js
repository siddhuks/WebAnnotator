const audioContext = new(window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const chartContainer = document.getElementById('chartContainer');
const canvas = chartContainer;
const ctx = document.getElementById('chartContainer').getContext('2d');
const p5SketchContainer = document.getElementById('p5SketchContainer');
const bufferLength = analyser.frequencyBinCount;
const chartSpinner = document.getElementById('chartSpinner');
const p5Spinner = document.getElementById('p5Spinner');
let data = [];
let myChart;
let arr1 = [];
let filterArr = [];
let files = [];
let isCSV = false;
let xArray = []
let yArray = []
let onsets;

let x = 0;
const selectedData = new Float32Array(bufferLength);
const sliceWidth = chartContainer ? chartContainer.clientWidth * 1.0 / bufferLength : 0; // Calculate sliceWidth if canvas exists
let audioBuffers = [];
let dataPoints = [];


document.getElementById('addAnnotationButton').addEventListener('click', function() {
    const xValue = parseFloat(document.getElementById('annotationXValue').value);
    addAnnotation(xValue);
});

function addAnnotation(xValue) {
    if (myChart && !isNaN(xValue)) {
        const annotation = {
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: xValue,
            borderColor: 'blue', // Different color to distinguish new annotations
            borderWidth: 2,
        };

        myChart.options.annotation.annotations.push(annotation);
        //filterArr.push(xValue); // Update filterArr with the new annotation value
        myChart.update();
    } else {
        console.warn('Invalid x value for annotation:', xValue);
    }
}


// Add these variables at the top of the script
let audioElement = document.getElementById('audioPlayer');
let currentAudioBuffer = null;
let sourceNode = null;

function showSpinner(spinner) {
    spinner.style.display = 'block';
    console.log("Spinner---------", spinner)
}

function hideSpinner(spinner) {
    spinner.style.display = 'none';
}

function initializeAudioPlayer(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        audioElement.src = e.target.result;
        audioElement.style.display = 'block';
    };
    reader.readAsDataURL(file); // Read the file as a Data URL for the audio element
}


// Function to handle audio processing and visualization
function processAndVisualize(arrayBuffer, fileIndex) {
    audioContext.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
            analyzeAmplitude(audioBuffer);
            audioBuffers[fileIndex] = audioBuffer;
            if (fileIndex === 0) { // Automatically visualize the first file
                updateChart(fileIndex);
            }

            if (document.getElementById('showSpectrogram').checked) {
                p5SketchContainer.style.display = 'block';
                console.log(".......................................")
                displayPrecomputedSpectrogram(fileIndex);
            }

        })
        .catch(error => {
            console.error('Error decoding audio:', error);
        })

}

// Add event listeners to the audio player for play, pause, and seek actions
audioElement.addEventListener('play', () => {
    if (sourceNode) {
        sourceNode.start(0, audioElement.currentTime);
    }
});

audioElement.addEventListener('pause', () => {
    if (sourceNode) {
        sourceNode.stop();
    }
});

audioElement.addEventListener('seeked', () => {
    if (sourceNode) {
        sourceNode.stop();
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = currentAudioBuffer;
        sourceNode.connect(audioContext.destination);
        sourceNode.start(0, audioElement.currentTime);
    }
});

// Function to display the precomputed spectrogram
async function displayPrecomputedSpectrogram(fileIndex) {
    p5SketchContainer.innerHTML = ''; // Clear previous content if any
    const file = files[fileIndex];
    console.log("filetype: ", file.type)
    const selectedFileIndex = document.getElementById('fileSelector').value;
    console.log("check : ", files[selectedFileIndex].type)
    if (files[selectedFileIndex].type === 'text/csv') {
        p5SketchContainer.style.display = 'none';
    } else {
        p5SketchContainer.style.display = 'block';
    }
    if (file.type === 'audio/wav' || file.type === 'audio/mpeg') {
        showSpinner(p5Spinner);
        try {
            console.log("file: ", file)

            const generatedFileName = await generateAndSaveSpectrogram(fileIndex);
            const spectrogramImage = new Image();
            const filePath = `http://127.0.0.1:9000/${generatedFileName}`;
            console.log('Attempting to load spectrogram image from:', filePath);
            spectrogramImage.src = filePath;
            spectrogramImage.onload = function() {
                p5SketchContainer.innerHTML = ''; // Clear previous content if any
                p5SketchContainer.appendChild(spectrogramImage);
            };

            spectrogramImage.onerror = function() {
                console.error('Error loading spectrogram image:', spectrogramImage.src);
                p5SketchContainer.innerHTML = `<p>Could not load spectrogram image at ${spectrogramImage.src}.</p>`;
            };
        } catch (error) {
            hideSpinner(p5Spinner);
            console.error('Error in generating or displaying spectrogram:', error);
        }
        hideSpinner(p5Spinner);
    }
}

audioElement.addEventListener('timeupdate', () => {
    if (myChart) {
        console.log("!!!!!!!!!!!")
        const currentTime = audioElement.currentTime;
        const newAnnotation = {
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: currentTime,
            borderColor: 'blue', // Different color to distinguish new annotations
            borderWidth: 2,
        };

        // Remove the previous annotation if it exists
        if (myChart.options.annotation.annotations.length > 0) {
            myChart.options.annotation.annotations.pop();
        }

        // Add the new annotation
        myChart.options.annotation.annotations.push(newAnnotation);
        console.log("currentTime: ", currentTime);
        myChart.update(); // Update the chart without animation
    }
});


async function generateAndSaveSpectrogram(fileIndex) {
    const formData = new FormData();
    console.log(files)
    formData.append('audio', files[fileIndex]);

    try {
        const response = await fetch('http://127.0.0.1:9000/generate-spectrogram', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log("data: ", data)

        if (data.success) {
            return data.image_path.split('/').pop(); // Return the file name from the path
        } else {
            console.error('Error generating spectrogram:', data.message);
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Function to show message for CSV files when Show Spectrogram is checked
function showNoSpectrogramMessage() {
    const spectrogramMessageContainer = document.getElementById('spectrogramMessageContainer');
    console.log("spectrogramMessageContainer", spectrogramMessageContainer)
    if (spectrogramMessageContainer) {
        spectrogramMessageContainer.innerHTML = 'No spectrogram for CSV files.';
        spectrogramMessageContainer.style.display = 'block';
    } else {
        console.warn("spectrogramMessageContainer not found.");
    }
}

function hideNoSpectrogramMessage() {
    const spectrogramMessageContainer = document.getElementById('spectrogramMessageContainer');
    if (spectrogramMessageContainer) {
        spectrogramMessageContainer.style.display = 'none';
    }
}


document.getElementById('showSpectrogram').addEventListener('change', function() {
    const selectedFileIndex = document.getElementById('fileSelector').value;
    if (this.checked) {

        if (audioBuffers.length > 0) {
            p5SketchContainer.style.display = 'block';
            console.log("----------------", selectedFileIndex)
            displayPrecomputedSpectrogram(selectedFileIndex);
        }
    } else {
        p5SketchContainer.style.display = 'none';
    }

    if (files[selectedFileIndex] && (files[selectedFileIndex].type === 'text/csv' || files[selectedFileIndex].name.endsWith('.csv'))) {
        if (this.checked) {
            console.log("CSV file selected and spectrogram checkbox is checked.");
            showNoSpectrogramMessage();
        } else {
            console.log("Spectrogram checkbox is unchecked.");
            hideNoSpectrogramMessage();
        }
    } else {
        console.log("Non-CSV file or no file selected.");
        hideNoSpectrogramMessage();
    }
});


// Function to process CSV file and update chart
function processCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const [xArr, yArr, arr] = parseCsvContent(content); // Implement this function based on your CSV format
        // Use xArray and yArray to update the chart data
        dataPoints = xArr.map((x, index) => ({ x, y: yArr[index] }));
        //console.log("psf dataPoints", dataPoints)
        //console.log("psf arr", arr)
        xArray = xArr
        yArray = yArr
        arr1 = arr
            //console.log("psf arr1", arr1)
            // if (index == 0) {
            //     updateChart(index);
            // }
            // Optionally use arr1 to position vertical lines
        isCSV = true;
        initializeChart(file); // You may need to adjust this function to accept data
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
    //console.log("psv: ", xArray, yArray, arr1)
    return [xArray, yArray, arr1];
}


function saveArraysAsCsv(xArray, yArray, arr1) {
    // Start with the column headers
    let csvContent = "X,Y,onset/offset\n";

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
    link.setAttribute("download", "audio_data.csv"); // Specify the file name
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
    console.log("audioLength: ", audioLength, "buf len: ", bufferLength)
    console.log("audioBuffer.duration: ", audioBuffer.duration)
        // var interval = audioLength / bufferLength;
    let interval = audioBuffer.duration / bufferLength
    console.log("interval: ", interval, "2: ", audioBuffer.duration / bufferLength)
    let y = 0;

    for (let i = 0; i < bufferLength; i++) {
        // const sampleIndex = Math.floor(i * interval);
        const sampleIndex = Math.floor(i * (audioBuffer.length / bufferLength));
        const channelData = audioBuffer.getChannelData(0);

        if (sampleIndex >= 0 && sampleIndex < channelData.length) {
            const sampleValue = channelData[sampleIndex];
            selectedData[i] = sampleValue;
        }
        y = selectedData[i];

        x += sliceWidth;
        x = i * interval;
        // console.log("1c", x, y)

        xArray.push(x)
        yArray.push(y)

        dataPoints.push({
            x: x,
            y: y
        });
        //console.log("1d", xArray, yArray)
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
        //console.log("audioBuffers: ", audioBuffer)
        if (audioBuffer) {
            analyzeAmplitude(audioBuffer);
            initializeChart(file); // Make sure audioBuffer is defined
            // if (document.getElementById('showSpectrogram').checked) {
            //     // generateSpectrogram(audioBuffer);
            //     displayPrecomputedSpectrogram(files[0].name.replace(/\.[^/.]+$/, ".png"));

            // }
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

async function initializeChart(file) {
    filterArr = arr1;
    //console.log("IC:, isCSV ", arr1, isCSV);
    filterArr = filterArr.filter(value => value !== null);
    filterArr = getRandomSubarray(xArray, 10);
    if (!isCSV && (file.type === 'audio/wav' || file.type === 'audio/mp3')) {
        showSpinner(chartSpinner);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', 'best'); // Assuming you want to include this based on your Python code
        try {
            // Fetch API to send the file to your backend
            const response = await fetch('http://127.0.0.1:8000/process-audio/', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            // Display the audio duration in the UI
            // Assuming you have an element with the ID 'audioLength' to display the duration
            //document.getElementById('audioLength').textContent = `Duration: ${result.duration} seconds`;
            onsets = result.notes.onsets;
            console.log("api call: ", result.notes.onsets)


        } catch (error) {
            hideSpinner(chartSpinner);
            console.error('Error uploading file:', error);
        }
        hideSpinner(chartSpinner);
        filterArr = onsets;
    }

    // filterArr.sort((a, b) => a - b);
    //console.log('getRandomSubarray: ', filterArr);
    // Comment this along with api call to get random arrays
    const annotations = filterArr.map((xValue) => {
        //console.log('filterArr, xValue: ', filterArr, xValue)
        //console.log('dataPoints: ', dataPoints)
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

    //console.log("annotations: ", annotations)

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
                        pinch: {
                            enabled: true // Enables zooming using pinch gestures on touch devices
                        },
                        onZoomComplete: function({ chart }) {
                            const zoomLevel = chart.scales['x-axis-0'].max - chart.scales['x-axis-0'].min;
                            const totalDataLength = xArray[xArray.length - 1] - xArray[0];
                            const container = document.getElementById('chartContainer');
                            console.log("container: ", container)
                            if (zoomLevel < totalDataLength) {
                                container.style.overflowX = 'auto';
                                console.log("container1: ", container)
                            } else {
                                container.style.overflowX = 'hidden';
                                console.log("container2: ", container)
                            }
                        },
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
    //console.log("pixelValue", pixelValue)
    //console.log("event", event)
    const xValue = xAxis.getValueForPixel(pixelValue);
    //console.log("Xvalue", xValue)
    // Return the precise value instead of rounding
    return xValue;
}

function getClosestLineIndex(myChart, mouseX) {
    const xAxis = myChart.scales['x-axis-0'];
    //console.log("xAxis", xAxis)
    let closestIndex = -1;
    let closestDistance = Infinity;

    myChart.options.annotation.annotations.forEach((annotation, index) => {

        if (annotation.type === "line" && annotation.mode === "vertical") {
            const distance = Math.abs(xAxis.getPixelForValue(annotation.value) - mouseX);
            //console.log("index: ", index, " annotation.value: ", annotation.value)
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }
    });

    return closestIndex;
}

// Function to delete the closest annotation based on mouse position
// function deleteClosestAnnotation(myChart, event) {
//     const xAxis = myChart.scales['x-axis-0'];
//     const mouseX = event.offsetX;
//     const mouseXValue = xAxis.getValueForPixel(mouseX);

//     let closestIndex = -1;
//     let closestDistance = Infinity;

//     myChart.options.annotation.annotations.forEach((annotation, index) => {
//         if (annotation.type === "line" && annotation.mode === "vertical") {
//             const distance = Math.abs(annotation.value - mouseXValue);
//             if (distance < closestDistance) {
//                 closestDistance = distance;
//                 closestIndex = index;
//             }
//         }
//     });

//     if (closestIndex !== -1) {
//         // Remove the annotation and update filterArr
//         myChart.options.annotation.annotations.splice(closestIndex, 1);
//         filterArr.splice(closestIndex, 1);
//         myChart.update();
//         console.log('Removed annotation at index:', closestIndex);
//     }
// }

document.getElementById('deleteToggle').addEventListener('change', function() {
    const deleteAnnotationMessageContainer = document.getElementById('deleteAnnotationMessageContainer');
    if (this.checked) {
        deleteAnnotationMessageContainer.innerHTML = 'Double click on annotation to delete.';
        deleteAnnotationMessageContainer.style.display = 'block';
    } else {
        deleteAnnotationMessageContainer.style.display = 'none';
    }
});


function deleteClosestAnnotation(myChart, event) {
    const xAxis = myChart.scales['x-axis-0'];
    const mouseX = event.offsetX;
    const mouseXValue = xAxis.getValueForPixel(mouseX);

    let closestIndex = -1;
    let closestDistance = Infinity;

    myChart.options.annotation.annotations.forEach((annotation, index) => {
        if (annotation.type === "line" && annotation.mode === "vertical") {
            const distance = Math.abs(annotation.value - mouseXValue);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }
    });

    if (closestIndex !== -1) {
        // Remove the annotation and update filterArr
        myChart.options.annotation.annotations.splice(closestIndex, 1);
        filterArr.splice(closestIndex, 1); // Ensure the corresponding entry in filterArr is removed
        myChart.update();
        //console.log('Removed annotation at index:', closestIndex);
    }
}



function setUpEventListeners() {

    // const showSpectrogramCheckbox = document.getElementById('showSpectrogram');
    // showSpectrogramCheckbox.addEventListener('change', () => {
    //     if (showSpectrogramCheckbox.checked) {
    //         p5SketchContainer.style.display = 'block';
    //     } else {
    //         p5SketchContainer.style.display = 'none';
    //     }
    // });

    // Set up the event listeners on the canvas
    canvas.addEventListener('mousedown', (event) => {

        isDragging = true;
        // Determine which line is closer to the drag start point
        dragLineIndex = getClosestLineIndex(myChart, event.offsetX);
        //console.log("md", dragLineIndex)
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging && dragLineIndex !== null) {
            const xValue = getXValue(myChart, event);
            // Update the position of the line being dragged
            myChart.options.annotation.annotations[dragLineIndex].value = xValue;
            //console.log("mv", event.offsetX, " dragLineIndex: ", dragLineIndex, "xValue:", xValue)
            //console.log("mvb filterArr ", filterArr)
            filterArr[dragLineIndex] = xValue;
            //console.log("mva filterArr ", filterArr)
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

    canvas.addEventListener('dblclick', (event) => {
        const deleteToggle = document.getElementById('deleteToggle').checked;
        if (deleteToggle) {
            deleteClosestAnnotation(myChart, event);
        }
    });

    // canvas.addEventListener('mouseleave', () => {
    //     isDragging = false;
    //     dragLineIndex = null;
    // });
}

// Event listener for the dropdown selection change
document.getElementById('fileSelector').addEventListener('change', function() {
    if (myChart) {
        myChart.destroy();
    }
    const selectedFileIndex = parseInt(this.value, 10);
    if (files[selectedFileIndex].type.startsWith('audio/')) {
        hideNoSpectrogramMessage();
        clearCurrentAudio();
        initializeAudioPlayer(files[selectedFileIndex]);
    }
    updateChart(selectedFileIndex);

    if (files[selectedFileIndex].type === 'text/csv') {
        audioElement.style.display = 'none';
    } else {
        audioElement.style.display = 'block';
    }

    // Generate and display the spectrogram for the selected file
    if (document.getElementById('showSpectrogram').checked) {
        // const fileName = files[selectedFileIndex].name.replace(/\.[^/.]+$/, ".png");
        // console.log("fileSelector: ", fileName)
        const selectedFileIndex = document.getElementById('fileSelector').value;
        console.log("check : ", files[selectedFileIndex].type)
        if (files[selectedFileIndex].type === 'text/csv') {
            p5SketchContainer.style.display = 'none';
        } else {
            p5SketchContainer.style.display = 'block';
            audioElement.style.display = 'block';
        }
        console.log("+++++++++++++++++")
        if (files[selectedFileIndex].type === 'audio/wav' || files[selectedFileIndex].type === 'audio/mpeg') {
            displayPrecomputedSpectrogram(selectedFileIndex);
        }
    }

    if (files[selectedFileIndex].type === 'text/csv' || files[selectedFileIndex].name.endsWith('.csv')) {
        if (document.getElementById('showSpectrogram').checked) {
            console.log("CSV file selected and spectrogram checkbox is checked on file selection.");
            showNoSpectrogramMessage();
        }
    }
});


if (performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD) {
    window.location.reload();
}


document.getElementById('fileInput').addEventListener('change', function() {
    files = this.files; // Update the global `files` variable with the newly selected files
    const fileSelector = document.getElementById('fileSelector');
    fileSelector.innerHTML = ''; // Clear existing options
    if (myChart) {
        myChart.destroy();
    }

    hideNoSpectrogramMessage();

    for (let i = 0; i < files.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `File ${i + 1}: ${files[i].name}`; // Custom label with file name
        fileSelector.appendChild(option);

        // Initialize audio player if the file is an audio file
        if (files.length > 0 && files[0].type.startsWith('audio/')) {
            clearCurrentAudio();
            initializeAudioPlayer(files[0]);
        }

        if (files[i].type === 'text/csv' || files[i].name.endsWith('.csv')) {
            if (document.getElementById('showSpectrogram').checked) {
                console.log("klm")
                showNoSpectrogramMessage();
            }
        }
    }


});

function clearCurrentAudio() {
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    audioElement.pause();
    audioElement.src = '';
}


// Handle the 'showChartButton' click separately
document.getElementById('showChartButton').addEventListener('click', function() {
    const files = document.getElementById('fileInput').files; // Correctly access the files

    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            // Check if the file is a CSV
            if (files[i].type === 'text/csv' || files[i].name.endsWith('.csv')) {
                p5SketchContainer.style.display = 'none';
                processCsvFile(files[i]);
            } else {
                // Process as audio file
                const reader = new FileReader();
                reader.onload = function(e) {
                    console.log("Spinner: ", chartSpinner)
                    processAndVisualize(e.target.result, i); // Process each audio file
                };
                reader.readAsArrayBuffer(files[i]);
            }
        }
    }
});

document.getElementById('reset').addEventListener('click', function() {
    myChart.resetZoom();
    // document.getElementById('chartContainer').style.overflowX = 'hidden';
});

document.getElementById('saveCsvButton').addEventListener('click', function() {
    saveArraysAsCsv(xArray, yArray, filterArr);
});

document.getElementById('deleteAnnotationButton').addEventListener('click', function() {
    const annotationId = document.getElementById('annotationIdInput').value;
    deleteAnnotation(annotationId);
});

function deleteAnnotation(annotationId) {
    if (myChart && myChart.options.annotation.annotations.length > 0) {
        const annotationIndex = myChart.options.annotation.annotations.findIndex(
            annotation => annotation.id === annotationId
        );

        if (annotationIndex !== -1) {
            const removedAnnotation = myChart.options.annotation.annotations.splice(annotationIndex, 1);
            console.log('Removed annotation:', removedAnnotation);

            // Optionally update filterArr to reflect the removal
            filterArr.splice(annotationIndex, 1);

            myChart.update();
        } else {
            console.warn('Annotation not found:', annotationId);
        }
    } else {
        console.warn('No annotations to delete.');
    }
}