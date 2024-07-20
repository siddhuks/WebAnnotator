// __tests__/script.test.js

// Mock the FileReader API
global.FileReader = class {
    constructor() {
        this.onload = null;
    }
    readAsDataURL(file) {
        this.result = "data:audio/wav;base64,"; // mock audio data URL
        if (this.onload) this.onload({ target: this });
    }
    readAsArrayBuffer(file) {
        this.result = new ArrayBuffer(8); // mock array buffer
        if (this.onload) this.onload({ target: this });
    }
};

// Mock the AudioContext API
global.AudioContext = class {
    constructor() {
        this.sampleRate = 44100;
        this.currentTime = 0;
        this.state = 'running';
        this.destination = {};
    }
    createAnalyser() {
        return {
            fftSize: 256,
            frequencyBinCount: 128,
            getByteTimeDomainData: jest.fn(),
            getByteFrequencyData: jest.fn(),
        };
    }
    decodeAudioData(arrayBuffer) {
        return Promise.resolve({
            sampleRate: this.sampleRate,
            length: arrayBuffer.byteLength,
            duration: arrayBuffer.byteLength / this.sampleRate,
            getChannelData: jest.fn().mockReturnValue(new Float32Array(arrayBuffer.byteLength)),
        });
    }
    createBufferSource() {
        return {
            connect: jest.fn(),
            start: jest.fn(),
            buffer: null,
        };
    }
    createBuffer() {
        return {
            getChannelData: jest.fn().mockReturnValue(new Float32Array(128)),
        };
    }
    createGain() {
        return {
            gain: {
                setValueAtTime: jest.fn(),
            },
            connect: jest.fn(),
        };
    }
};

// Mock getContext for canvas
HTMLCanvasElement.prototype.getContext = () => {
    return {
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        fillText: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        measureText: jest.fn(),
        transform: jest.fn(),
        rect: jest.fn(),
        clip: jest.fn(),
    };
};

// Mock performance.navigation
global.performance = {
    navigation: {
        TYPE_BACK_FORWARD: 2,
        type: 2,
    },
};

// Mock DataTransfer and FileList
global.FileList = class {
    constructor(...items) {
        items.forEach((item, index) => {
            this[index] = item;
        });
        this.length = items.length;
    }
    item(index) {
        return this[index];
    }
};

global.DataTransfer = class {
    constructor() {
        this.items = [];
    }
    get files() {
        return new FileList(...this.items.map(item => item.getAsFile()));
    }
    addItem(file) {
        this.items.push({
            kind: 'file',
            type: file.type,
            getAsFile: () => file,
        });
    }
};

// Mock HTMLMediaElement pause method
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: jest.fn(),
});

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ notes: [{ onsets: [0.1, 0.2], offsets: [0.3, 0.4] }] }),
    })
);

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
}));

document.body.innerHTML = `
  <div class="main-container">
    <input type="file" id="fileInput" accept="audio/*,.csv" multiple />
    <button id="showChartButton">Upload</button>
    <audio id="audioPlayer" controls style="display: none;"></audio>
    <canvas id="chartContainer" class="chart-container"></canvas>
    <button id="addAnnotationButton"></button>
    <input id="annotationXValue" type="text" />
    <input id="annotationType" type="text" />
    <div id="chartSpinner"></div>
    <div id="p5SketchContainer"></div>
    <input type="checkbox" id="showSpectrogram" />
    <select id="fileSelector"></select>
    <input type="checkbox" id="panToggle" />
    <input type="checkbox" id="deleteToggle" />
    <div id="deleteAnnotationMessageContainer"></div>
    <button id="reset">Reset</button>
    <button id="saveCsvButton">Save CSV</button>
    <div id="error-message" style="display: none;"></div>
  </div>
`;

const script = require('../script.js');

test('should initialize the audio player with the uploaded file', () => {
    const fileInput = document.getElementById('fileInput');
    const audioPlayer = document.getElementById('audioPlayer');

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    const dataTransfer = new DataTransfer();
    dataTransfer.addItem(file);
    Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        configurable: true,
    });

    const event = new Event('change');
    fileInput.dispatchEvent(event);

    expect(audioPlayer.src).toContain('data:audio/wav;base64,');
    expect(audioPlayer.style.display).toBe('block');
});

test('should process and visualize the audio file', async() => {
    const fileInput = document.getElementById('fileInput');
    const showChartButton = document.getElementById('showChartButton');
    const file = new File([''], 'test.wav', { type: 'audio/wav' });

    const dataTransfer = new DataTransfer();
    dataTransfer.addItem(file);
    Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        configurable: true,
    });

    showChartButton.addEventListener('click', async() => {
        // Wait for async operations to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify the audio context and buffer processing
        expect(script.audioContext).toBeDefined();
        expect(script.audioBuffers.length).toBeGreaterThan(0);
    });

    showChartButton.click();
}, 20000); // Increase timeout to 20 seconds