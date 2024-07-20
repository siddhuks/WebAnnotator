// Mocking AudioContext for the tests
class MockAudioContext {
    constructor() {
        this.destination = {};
        this.sampleRate = 44100;
    }
    createAnalyser() {
        return {
            fftSize: 2048,
            getByteTimeDomainData: () => {},
            getByteFrequencyData: () => {},
        };
    }
    createGain() {
        return {
            gain: {
                setValueAtTime: () => {},
            },
            connect: () => {},
            disconnect: () => {},
        };
    }
    createOscillator() {
        return {
            frequency: {
                setValueAtTime: () => {},
            },
            connect: () => {},
            disconnect: () => {},
            start: () => {},
            stop: () => {},
        };
    }
    decodeAudioData() {
        return Promise.resolve({});
    }
    close() {
        return Promise.resolve();
    }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;