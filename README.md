# WebAnnotator

## Overview

This project is a web-based tool designed to help users visually edit annotations for the start (onset) and end (offset) of musical notes in audio files. It provides a user-friendly interface for uploading audio and CSV files, visualizing the audio data, and manually adjusting the annotations. The tool is built primarily with HTML, CSS, and JavaScript, with a small back-end component in Python for processing audio files and generating spectrograms.

## Features

- Upload and visualize audio files in various formats (WAV, MP3, FLAC, OGG).
- Upload and display CSV files containing annotated data.
- Manually add, delete, and modify onset and offset annotations.
- Display spectrograms of audio files.
- Pan and zoom functionality for detailed inspection.
- Save the annotated data as a CSV file.

## Getting Started

### Prerequisites

- A web server to host the HTML, CSS, and JavaScript files.


### Installation

1. Clone the repository to your local machine:
    
    git clone https://github.com/siddhuks/WebAnnotator.git
    

2. Navigate to the project directory:
    
    cd webAnnotator


3. Install dependencies:
    
    npm install

4. Command to test unit test cases:

    npm test
    

5. Open `interface.html` in your web browser to start using the tool.

### Files

- `interface.html`: The main HTML file containing the structure of the web interface.
- `style.css`: The CSS file for styling the web interface.
- `script.js`: The JavaScript file containing the logic for handling file uploads, visualizations, and interactions.


## Usage

1. Open `interface.html` in your web browser.
2. Use the file input to upload audio or CSV files.
3. Click the "Upload" button to visualize the data.
4. Use the controls to add, delete, or modify annotations.
5. Optionally, check the "Spectrogram" checkbox to display the spectrogram of the audio file.
6. Use the "Save as CSV" button to save the annotated data.


## Acknowledgments

- [Chart.js](https://www.chartjs.org/)
- [p5.js](https://p5js.org/)