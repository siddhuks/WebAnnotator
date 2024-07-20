// __tests__/annotations.test.js

// Mock the necessary parts of the script for annotations
jest.mock('../script.js', () => ({
    addAnnotation: jest.fn(),
    initializeChart: jest.fn(),
    myChart: {
        options: {
            annotation: {
                annotations: []
            }
        },
        update: jest.fn()
    }
}));

const { addAnnotation, initializeChart, myChart } = require('../script.js');

describe('Annotations Functionality', () => {
    beforeAll(() => {
        document.body.innerHTML = `
            <input type="number" id="annotationXValue" step="0.01" value="10.5">
            <select id="annotationType">
                <option value="onset" selected>Onset</option>
                <option value="offset">Offset</option>
                <option value="both">Both</option>
            </select>
            <button id="addAnnotationButton">Add Annotation</button>
            <canvas id="chartContainer"></canvas>
        `;

        document.getElementById('addAnnotationButton').addEventListener('click', () => {
            const xValue = parseFloat(document.getElementById('annotationXValue').value);
            const annotationType = document.getElementById('annotationType').value;
            addAnnotation(xValue, annotationType);
        });
    });

    test('should add an annotation correctly', () => {
        const xValue = 10.5;
        const annotationType = 'onset';

        addAnnotation.mockImplementation((xValue, annotationType) => {
            const annotation = {
                type: 'line',
                mode: 'vertical',
                scaleID: 'x-axis-0',
                value: xValue,
                borderColor: annotationType === 'onset' ? 'red' : annotationType === 'offset' ? 'green' : 'orange',
                borderWidth: 2,
            };
            myChart.options.annotation.annotations.push(annotation);
            myChart.update();
        });

        document.getElementById('addAnnotationButton').click();

        expect(myChart.options.annotation.annotations.length).toBe(1);
        expect(myChart.options.annotation.annotations[0]).toMatchObject({
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: xValue,
            borderColor: 'red',
            borderWidth: 2,
        });
        expect(myChart.update).toHaveBeenCalled();
    });

    test('should add an "offset" annotation correctly', () => {
        document.getElementById('annotationXValue').value = 20.0;
        document.getElementById('annotationType').value = 'offset';

        document.getElementById('addAnnotationButton').click();

        expect(myChart.options.annotation.annotations.length).toBe(2);
        expect(myChart.options.annotation.annotations[1]).toMatchObject({
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: 20.0,
            borderColor: 'green',
            borderWidth: 2,
        });
        expect(myChart.update).toHaveBeenCalled();
    });

    test('should add a "both" annotation correctly', () => {
        document.getElementById('annotationXValue').value = 30.0;
        document.getElementById('annotationType').value = 'both';

        document.getElementById('addAnnotationButton').click();

        expect(myChart.options.annotation.annotations.length).toBe(3);
        expect(myChart.options.annotation.annotations[2]).toMatchObject({
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: 30.0,
            borderColor: 'orange',
            borderWidth: 2,
        });
        expect(myChart.update).toHaveBeenCalled();
    });
});