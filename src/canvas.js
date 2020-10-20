/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData,sunImage;


function setupCanvas(canvasElement,analyserNodeRef){
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"#90EE90"},{percent:0.5,color:"#0288D1"},{percent:1,color:"#663A82"}]);
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
	audioData = new Uint8Array(analyserNode.fftSize/2);
    sunImage = document.querySelector("#sunImage");
}

function draw(params={}){
  // 1 - populate the audioData array with the frequency data from the analyserNode
	// notice these arrays are passed "by reference" 
	analyserNode.getByteFrequencyData(audioData);
	// OR
	//analyserNode.getByteTimeDomainData(audioData); // waveform data
	
	// 2 - draw background
	ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
    
	if(params.showGradient)
    {
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 1;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
    if(params.showCircles){
        let maxRadius = canvasHeight/3;
        let percent = 0;
        for(let i = 0; i < audioData.length; i++)
        {
            percent += audioData[i];
        }
        percent /= audioData.length * 255;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.translate(canvasWidth / 2, canvasHeight / 3);
        ctx.scale(1 + (percent * 1.2), 1 + (percent * 1.2));
        ctx.drawImage(sunImage, -maxRadius / 2, -maxRadius / 2, maxRadius, maxRadius);
        ctx.restore();
    }
	if(params.showBars){
        let barSpacing = 1;
        let margin = 2;
        let screenWidthForBars = canvasWidth - (audioData.length * 2 * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / (audioData.length * 2);
        let barHeight = 200;
        let topSpacing = 100;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255,165,51,1)';
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        for(let i = 0; i < audioData.length; i++)
        {
            let height = (audioData[i] / 255) * barHeight;
            height = height > (barHeight / 20) ? height : (barHeight / 20);
            ctx.fillRect(margin + (audioData.length - i) * (barWidth + barSpacing), canvasHeight - height, barWidth, height);
            ctx.strokeRect(margin + (audioData.length - i) * (barWidth + barSpacing), canvasHeight - height, barWidth, height);
        }
        for(let i = 1; i < audioData.length; i++)
        {
            let height = (audioData[i] / 255) * barHeight;
            height = height > (barHeight / 20) ? height : (barHeight / 20);
            ctx.fillRect(canvasWidth - (margin + (audioData.length - i) * (barWidth + barSpacing)), canvasHeight - height, barWidth, height);
            ctx.strokeRect(canvasWidth - (margin + (audioData.length - i) * (barWidth + barSpacing)), canvasHeight - height, barWidth, height);
        }
        ctx.restore();
    }
    
    // 6 - bitmap manipulation
	// TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
	// regardless of whether or not we are applying a pixel effect
	// At some point, refactor this code so that we are looping though the image data only if
	// it is necessary

	// A) grab all of the pixels on the canvas and put them in the `data` array
	// `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
	// the variable `data` below is a reference to that array
    let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width;
	
	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for(let i = 0; i < length; i += 4)
    {
		// C) randomly change every 20th pixel to red
	   if(params.showNoise && Math.random() < 0.05){
			// data[i] is the red channel
			// data[i+1] is the green channel
			// data[i+2] is the blue channel
			// data[i+3] is the alpha channel
			data[i] = data[i + 1] = data[i + 2] = 255;
		} // end if
        if(params.invertColors)
        {
            let red = data[i], green = data[i + 1], blue = data[i + 2];
            data[i] = 255 - red;
            data[i + 1] = 255 - green;
            data[i + 2] = 255 - blue;
        }
	} // end for
    
    if(params.showEmboss)
    {
        for(let i = 0; i < length; i++)
        {
            if(i % 4 == 3)
            {
                continue;
            }
            data[i] = 127 + 2 * data[i] - data [i + 4] - data[i + width * 4];
        }
    }
	
	// D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);
}

export {setupCanvas,draw};