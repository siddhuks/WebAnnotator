// __tests__/saveCsv.test.js

// Mock the necessary parts of the script for saving CSV
jest.mock('../script.js', () => ({
    saveArraysAsCsv: jest.fn(),
    myChart: {
        options: {
            annotation: {
                annotations: []
            }
        }
    }
}));

const { saveArraysAsCsv, myChart } = require('../script.js');

describe('Save CSV Functionality', () => {
    beforeAll(() => {
        global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost:3000/some-blob-url');

        document.body.innerHTML = `
            <button id="saveCsvButton">Save CSV</button>
        `;

        document.getElementById('saveCsvButton').addEventListener('click', () => {
            const xArray = [1, 2, 3];
            const yArray = [10, 20, 30];
            const filterArr = [1.5];
            const filterArr2 = [2.5];
            saveArraysAsCsv(xArray, yArray, filterArr, filterArr2);
        });
    });

    afterAll(() => {
        delete global.URL.createObjectURL;
    });

    test('should save annotations and data as CSV', () => {
        const xArray = [1, 2, 3];
        const yArray = [10, 20, 30];
        const filterArr = [1.5];
        const filterArr2 = [2.5];

        saveArraysAsCsv.mockImplementation((xArray, yArray, filterArr, filterArr2) => {
            const csvContent = "X,Y,Onset,Offset\n" +
                xArray.map((x, i) => `${x},${yArray[i] || ''},${filterArr[i] || ''},${filterArr2[i] || ''}`).join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "annotations.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        document.getElementById('saveCsvButton').click();

        expect(saveArraysAsCsv).toHaveBeenCalledWith(xArray, yArray, filterArr, filterArr2);
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
});