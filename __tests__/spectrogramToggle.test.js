// __tests__/spectrogramToggle.test.js

// Mock the necessary parts of the script for spectrogram toggle
jest.mock('../script.js', () => ({
    displayPrecomputedSpectrogram: jest.fn(),
    hideNoSpectrogramMessage: jest.fn(),
    showNoSpectrogramMessage: jest.fn(),
}));

const { displayPrecomputedSpectrogram, hideNoSpectrogramMessage, showNoSpectrogramMessage } = require('../script.js');

describe('Spectrogram Toggle Functionality', () => {
    beforeAll(() => {
        document.body.innerHTML = `
            <input type="checkbox" id="showSpectrogram">
            <div id="p5SketchContainer" class="chart-container" style="display: none"></div>
            <div id="spectrogramMessageContainer" style="display: none;"></div>
            <select id="fileSelector">
                <option value="0">File 1: valid.wav</option>
                <option value="1">File 2: data.csv</option>
            </select>
        `;

        document.getElementById('showSpectrogram').addEventListener('change', function() {
            const selectedFileIndex = document.getElementById('fileSelector').value;
            if (this.checked) {
                if (selectedFileIndex === '1') { // CSV file
                    showNoSpectrogramMessage();
                } else {
                    displayPrecomputedSpectrogram(selectedFileIndex);
                    document.getElementById('p5SketchContainer').style.display = 'block';
                }
            } else {
                document.getElementById('p5SketchContainer').style.display = 'none';
                hideNoSpectrogramMessage();
            }
        });
    });

    test('should display spectrogram for audio files when checkbox is checked', () => {
        document.getElementById('fileSelector').value = '0'; // Select audio file
        const checkbox = document.getElementById('showSpectrogram');

        checkbox.checked = true;
        const event = new Event('change');
        checkbox.dispatchEvent(event);

        expect(displayPrecomputedSpectrogram).toHaveBeenCalledWith('0');
        expect(document.getElementById('p5SketchContainer').style.display).toBe('block');
    });

    test('should hide spectrogram when checkbox is unchecked', () => {
        const checkbox = document.getElementById('showSpectrogram');

        checkbox.checked = false;
        const event = new Event('change');
        checkbox.dispatchEvent(event);

        expect(document.getElementById('p5SketchContainer').style.display).toBe('none');
        expect(hideNoSpectrogramMessage).toHaveBeenCalled();
    });

    test('should show no spectrogram message for CSV files when checkbox is checked', () => {
        document.getElementById('fileSelector').value = '1'; // Select CSV file
        const checkbox = document.getElementById('showSpectrogram');

        checkbox.checked = true;
        const event = new Event('change');
        checkbox.dispatchEvent(event);

        expect(showNoSpectrogramMessage).toHaveBeenCalled();
        expect(document.getElementById('p5SketchContainer').style.display).toBe('none');
    });
});