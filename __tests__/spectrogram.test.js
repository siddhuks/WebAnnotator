// __tests__/spectrogram.test.js

// Mock the necessary parts of the script for spectrogram generation
jest.mock('../script.js', () => ({
    displayPrecomputedSpectrogram: jest.fn(),
    generateAndSaveSpectrogram: jest.fn(),
}));

const { displayPrecomputedSpectrogram, generateAndSaveSpectrogram } = require('../script.js');

describe('Spectrogram Generation', () => {
    beforeAll(() => {
        global.FileReader = class {
            constructor() {
                this.onload = null;
                this.onerror = null;
            }
            readAsArrayBuffer(file) {
                if (file.name === 'valid.wav') {
                    const event = {
                        target: {
                            result: new ArrayBuffer(8), // Mocked ArrayBuffer for a valid file
                        },
                    };
                    this.onload(event);
                } else if (file.name === 'invalid.wav') {
                    this.onerror(new Error('File reading error'));
                }
            }
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ success: true, image_path: 'spectrogram.png' }),
            })
        );
    });

    test('should generate and display spectrogram for a valid audio file', async() => {
        const file = new File([''], 'valid.wav');
        document.body.innerHTML = `
            <div id="p5SketchContainer" class="chart-container" style="display: none"></div>
            <div id="error-message"></div>
        `;

        generateAndSaveSpectrogram.mockImplementation(() => Promise.resolve('spectrogram.png'));
        displayPrecomputedSpectrogram.mockImplementation(() => {
            const img = document.createElement('img');
            img.src = 'spectrogram.png';
            document.getElementById('p5SketchContainer').appendChild(img);
        });

        await generateAndSaveSpectrogram(0);
        displayPrecomputedSpectrogram(0);

        const img = document.querySelector('#p5SketchContainer img');
        expect(img).not.toBeNull();
        expect(img.src).toContain('spectrogram.png');
    });

    test('should handle file reading error gracefully', async() => {
        const file = new File([''], 'invalid.wav');

        // Mock the implementation to simulate a file reading error
        generateAndSaveSpectrogram.mockImplementation(() => {
            const error = new Error('File reading error');
            document.getElementById('error-message').innerHTML = 'Unable to load the file. Please ensure it is a valid and supported audio format.';
            return Promise.reject(error);
        });

        await expect(generateAndSaveSpectrogram(0)).rejects.toThrow('File reading error');

        const errorMessage = document.getElementById('error-message');
        expect(errorMessage.innerHTML).toContain('Unable to load the file');
    });
});