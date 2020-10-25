/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
	sound1  :  "media/synthetic.mp3"
});

let gridSpeed,barHeightPercentage,sunPercentage,progress;

const drawParams = {
    showGradient: true,
    showBars : true,
    showSun : true,
    showNoise : false,
    invertColors : false,
    showEmboss : false,
    showGrayscale : false,
    showGrid : true,
    showCurve: true
};

function init(){
    audio.setupWebaudio(DEFAULTS.sound1);
	console.log("init called");
	console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
	let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
	setupUI(canvasElement);
    canvas.setupCanvas(canvasElement,audio.analyserNode);
    loop();
}

function setupUI(canvasElement){
    // A - hookup fullscreen button
    const fsButton = document.querySelector("#fsButton");

    // add .onclick event to button
    fsButton.onclick = e => {
    console.log("init called");
    utils.goFullscreen(canvasElement);
    };

    // add .onclick event to button
    const playButton = document.querySelector("#playButton");
    playButton.onclick = e => {
        console.log(`audioCtx.state before = ${audio.audioCtx.state}`);
        
        // check if context is in suspended state (autoplay policy)
        if(audio.audioCtx.state == "suspended") {
            audio.audioCtx.resume();
        }
        console.log(`audioCtx.state after = ${audio.audioCtx.state}`);
        if(e.target.dataset.playing == "no"){
            // if track is currently paused, play it
            audio.playCurrentSound();
            e.target.dataset.playing = "yes"; // our CSS will set the text to "Pause"
            // if track IS playing, pause it
        }else{
            audio.pauseCurrentSound();
            e.target.dataset.playing = "no"; // our CSS will set the text to "Play"
        }
    };
    
    // C - hookup volume slider & label
    let volumeSlider = document.querySelector("#volumeSlider");
    let volumeLabel = document.querySelector("#volumeLabel");
    
    // add .oninput event to slider
    volumeSlider.oninput = e => {
        // set the gain
        audio.setVolume(e.target.value);
        // update value of label to match value of slider
        volumeLabel.innerHTML = Math.round((e.target.value/2 * 100));
    };
    
    // set value of label to match initial value of slider
    volumeSlider.dispatchEvent(new Event("input"));
    
    // D - hookup track <select>
    let trackSelect = document.querySelector("#trackSelect");
    // add .onchange event to <select>
    trackSelect.onchange = e => {
        audio.loadSoundFile(e.target.value);
        // pause the current track if it is playing
        if(playButton.dataset.playing == "yes"){
            playButton.dispatchEvent(new MouseEvent("click"));
        }
    }
    
    let gradientCB = document.querySelector("#gradientCB");
    gradientCB.checked = true;
    gradientCB.onclick = function(){
        drawParams.showGradient = gradientCB.checked;
    }
    
    let barsCB = document.querySelector("#barsCB");
    barsCB.checked = true;
    barsCB.onclick = function(){
        drawParams.showBars = barsCB.checked;
    }
    
    let sunCB = document.querySelector("#sunCB");
    sunCB.checked = true;
    sunCB.onclick = function(){
        drawParams.showSun = sunCB.checked;
    }
    
    let noiseCB = document.querySelector("#noiseCB");
    noiseCB.onclick = function(){
        drawParams.showNoise = noiseCB.checked;
    }
    
    let invertColorsCB = document.querySelector("#invertColorsCB");
    invertColorsCB.onclick = function(){
        drawParams.invertColors = invertColorsCB.checked;
    }
    
    let embossCB = document.querySelector("#embossCB");
    embossCB.onclick = function(){
        drawParams.showEmboss = embossCB.checked;
    }
    
    let grayscaleCB = document.querySelector("#grayscaleCB");
    grayscaleCB.onclick = function(){
        drawParams.showGrayscale = grayscaleCB.checked;
    }
    
    document.querySelector('#highshelfCB').checked = false;

    document.querySelector('#highshelfCB').onchange = e => {
        audio.toggleHighshelf();
    };

    document.querySelector('#lowshelfCB').checked = false;

    document.querySelector('#lowshelfCB').onchange = e => {
        audio.toggleLowshelf();
    }
    
    let gridSlider = document.querySelector("#gridSlider");
    let gridLabel = document.querySelector("#gridLabel");
    
    gridSlider.oninput = e => {
        gridSpeed = e.target.value;
        gridLabel.innerHTML = e.target.value;
    };
    
    gridSlider.dispatchEvent(new Event("input"));
    
    let barSlider = document.querySelector("#barSlider");
    let barLabel = document.querySelector("#barLabel");
    
    barSlider.oninput = e => {
        barHeightPercentage = e.target.value;
        barLabel.innerHTML = e.target.value;
    };
    
    barSlider.dispatchEvent(new Event("input"));
    
    let sunSlider = document.querySelector("#sunSlider");
    let sunLabel = document.querySelector("#sunLabel");
    
    sunSlider.oninput = e => {
        sunPercentage = e.target.value;
        sunLabel.innerHTML = e.target.value;
    };
    
    sunSlider.dispatchEvent(new Event("input"));
    
    let frequencyButton = document.querySelector("#frequency");
    frequencyButton.onclick = e => {
        canvas.updateAudioDataType(e.target.value);
    }
    
    let waveformButton = document.querySelector("#waveform");
    waveformButton.onclick = e => {
        canvas.updateAudioDataType(e.target.value);
    }
    
    progress = document.querySelector("#progress");
    
    let progressCurveCB = document.querySelector("#progressCurveCB");
    progressCurveCB.checked = true;
    progressCurveCB.onchange = e => {
        drawParams.showCurve = progressCurveCB.checked;
    }
} // end setupUI

function loop(){
	requestAnimationFrame(loop);
    canvas.draw(drawParams);
    canvas.updateGrid(gridSpeed);
    canvas.updateBarPercent(barHeightPercentage);
    canvas.updateSunPercent(sunPercentage);
    progress.innerHTML = "Progress: " + Math.round(audio.getProgress() * 100) + "%";
}

export {init};