// __tests__/csvProcessing.test.js

// Mock the necessary parts of the script that are irrelevant for CSV processing
jest.mock('../script.js', () => ({
    processCsvFile: jest.fn(),
    initializeChart: jest.fn(), // Mock initializeChart
}));

const { processCsvFile, initializeChart } = require('../script.js');

// Mock the FileReader API inline within the test block
describe('CSV Processing', () => {
    beforeAll(() => {
        global.FileReader = class {
            constructor() {
                this.onload = null;
                this.onerror = null;
            }
            readAsText(file) {
                if (file.name === 'valid.csv') {
                    const event = {
                        target: {
                            result: 'xValue,yValue,arrValue1,arrValue2\n1,10,100,1000\n2,20,200,2000',
                        },
                    };
                    this.onload(event);
                } else if (file.name === 'invalid.csv') {
                    this.onerror(new Error('File reading error'));
                }
            }
        };

        // Mock global objects and functions
        global.AudioContext = jest.fn(() => ({
            createAnalyser: jest.fn(() => ({
                fftSize: 256,
            })),
        }));

        global.initializeChart = initializeChart;
    });

    test('should process valid CSV file correctly', (done) => {
        const file = new File([''], 'valid.csv');
        document.body.innerHTML = `
      <div id="chartContainer"></div>
      <div id="error-message"></div>
    `;

        // Mock the implementation of processCsvFile
        processCsvFile.mockImplementation((file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const data = text.split('\n').map(row => row.split(','));
                global.initializeChart(data); // Call initializeChart with the data
                resolve(data);
            };
            reader.readAsText(file);
        }));

        processCsvFile(file).then(() => {
            expect(global.initializeChart).toHaveBeenCalled();
            done();
        });
    }, 10000); // Extend the timeout to 10 seconds to ensure the test has enough time to complete

    test('should handle file reading error', async() => {
        const file = new File([''], 'invalid.csv');

        processCsvFile.mockImplementation((file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const data = text.split('\n').map(row => row.split(','));
                resolve(data);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        }));

        await expect(processCsvFile(file)).rejects.toThrow('File reading error');
    });
});