const audioContext = new(window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;
const chartContainer1 = document.getElementById('chartContainer1');

const bufferLength = analyser.frequencyBinCount;
let data = [];

let x = 0;
const selectedData = new Float32Array(bufferLength);
const sliceWidth = chartContainer1 ? chartContainer1.clientWidth * 1.0 / bufferLength : 0; // Calculate sliceWidth if canvas exists
let audioBuffers = [];

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


// Function to update the chart based on the selected file
function updateChart(fileIndex) {
    const audioBuffer = audioBuffers[fileIndex];
    analyzeAmplitude(audioBuffer); // Process audio data
    // Visualize the data in 'chartContainer1' as we're now using a single container
    const chart1 = new CanvasJS.Chart("chartContainer1", {
        animationEnabled: true,
        zoomEnabled: true,
        title: {
            text: "Amplitude vs Time"
        },
        data: data
    });
    chart1.render();
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




function analyzeAmplitude(audioBuffer) {
    x = 0;
    data = [];
    let dataPoints = [];
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

        dataPoints.push({
            x: x,
            y: y
        });
    }

    var dataSeries = {
        type: "spline"
    };

    dataSeries.dataPoints = dataPoints;
    data.push(dataSeries);
}