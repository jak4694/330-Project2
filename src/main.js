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
	sound1  :  "media/New Adventure Theme.mp3"
});

const drawParams = {
    showGradient: true,
    showBars : true,
    showCircles : true,
    showNoise : false,
    invertColors : false,
    showEmboss : false
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
    
    let circlesCB = document.querySelector("#circlesCB");
    circlesCB.checked = true;
    circlesCB.onclick = function(){
        drawParams.showCircles = circlesCB.checked;
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
    
    document.querySelector('#highshelfCB').checked = false;

    document.querySelector('#highshelfCB').onchange = e => {
        audio.toggleHighshelf();
    };

    document.querySelector('#lowshelfCB').checked = false;

    document.querySelector('#lowshelfCB').onchange = e => {
        audio.toggleLowshelf();
    }
} // end setupUI

function loop(){
	requestAnimationFrame(loop);
    canvas.draw(drawParams);
    
	// 1) create a byte array (values of 0-255) to hold the audio data
	// normally, we do this once when the program starts up, NOT every frame
	let audioData = new Uint8Array(audio.analyserNode.fftSize/2);
	
	// 2) populate the array of audio data *by reference* (i.e. by its address)
	audio.analyserNode.getByteFrequencyData(audioData);
}

export {init};