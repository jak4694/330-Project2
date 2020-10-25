/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';
import { getProgress } from './audio.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData,sunImage;

let gridOffsetPercentage = 0;
let barHeightPercentage = 1;
let sunPercentage = 1;
let audioDataType = "frequency";

function updateGrid(multiplier = 1)
{
    gridOffsetPercentage += (0.01 * multiplier);
    if(gridOffsetPercentage > 1)
    {
        gridOffsetPercentage--;
    }
}

function updateBarPercent(percentage)
{
    barHeightPercentage = percentage;
}

function updateSunPercent(percentage)
{
    sunPercentage = percentage;
}

function updateAudioDataType(dataType)
{
    audioDataType = dataType;
}

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
    if(audioDataType == "frequency")
    {
        analyserNode.getByteFrequencyData(audioData);
    }
	else
    {
        analyserNode.getByteTimeDomainData(audioData);
    }
	
	// 2 - draw background
	ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
    
    let bottomOffset = canvasHeight / 4;
    
	if(params.showGradient)
    {
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 1;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
    if(params.showCurve)
    {
        let yPos = canvasHeight / 8;
        let curveWidth = 20;
        let curveHeight = 150;
        let progress = getProgress();
        ctx.save();
        ctx.strokeStyle = "black";
        let percent = 0;
        for(let i = 0; i < audioData.length; i++)
        {
            percent += audioData[i];
        }
        percent /= audioData.length * 255;
        let startX = (canvasWidth * progress) - (curveWidth / 2);
        let endX = (canvasWidth * progress) + (curveWidth / 2)
        if(progress > 0 && progress < 100 && percent > 0)
        {
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.quadraticCurveTo(startX + (curveWidth / 2), curveHeight * percent, endX, 0);
            ctx.stroke();
        }
        ctx.restore();
    }
    if(params.showSun)
    {
        let maxRadius = (canvasHeight / 3.5) * sunPercentage;
        let percent = 0;
        for(let i = 0; i < audioData.length; i++)
        {
            percent += audioData[i];
        }
        percent /= audioData.length * 255;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.translate(canvasWidth / 2, canvasHeight / 3.5);
        ctx.scale(1 + (percent * 1.2), 1 + (percent * 1.2));
        ctx.rotate(Math.PI);
        ctx.drawImage(sunImage, -maxRadius / 2, -maxRadius / 2, maxRadius, maxRadius);
        ctx.restore();
    }
	if(params.showBars)
    {
        let barSpacing = 1;
        let margin = 2;
        let screenWidthForBars = canvasWidth - (audioData.length * 2 * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / (audioData.length * 2);
        let barHeight = (canvasHeight / 2.7) * barHeightPercentage;
        let minimumPercentage = 0.05;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255,165,51,1)';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let height;
        ctx.moveTo(margin + barSpacing, canvasHeight - bottomOffset);
        height = (audioData[audioData.length - 1] / 255) * barHeight;
        height = height > (barHeight * minimumPercentage) ? height : (barHeight * minimumPercentage);
        ctx.lineTo(margin + barSpacing, canvasHeight - height - bottomOffset);
        for(let i = audioData.length - 2; i >= 0; i--)
        {
            height = (audioData[i] / 255) * barHeight;
            height = height > (barHeight * minimumPercentage) ? height : (barHeight * minimumPercentage);
            ctx.lineTo(margin + (audioData.length - i - 1) * (barWidth + barSpacing), canvasHeight - height - bottomOffset);
            ctx.lineTo(margin + (audioData.length - i - 1) * (barWidth + barSpacing), canvasHeight - bottomOffset);
            ctx.moveTo(margin + (audioData.length - i - 1) * (barWidth + barSpacing), canvasHeight - height - bottomOffset);
        }
        for(let i = 0; i < audioData.length; i++)
        {
            height = (audioData[i] / 255) * barHeight;
            height = height > (barHeight * minimumPercentage) ? height : (barHeight * minimumPercentage);
            ctx.lineTo(margin + (audioData.length + i) * (barWidth + barSpacing), canvasHeight - height - bottomOffset);
            ctx.lineTo(margin + (audioData.length + i) * (barWidth + barSpacing), canvasHeight - bottomOffset);
            ctx.moveTo(margin + (audioData.length + i) * (barWidth + barSpacing), canvasHeight - height - bottomOffset);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight - bottomOffset);
        ctx.lineTo(canvasWidth, canvasHeight - bottomOffset);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    if(params.showGrid)
    {
        let verticalLines = 15;
        let horizontalLines = 5;
        let horizontalMargin = 10;
        let bottomSpacing = 5;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(248,24,148,1)';
        ctx.lineWidth = 3;
        for(let i = 0; i < verticalLines; i++)
        {
            let x = (canvasWidth - horizontalMargin) * (i / (verticalLines - 1)) + (horizontalMargin / 2);
            let spacing = (i - ((verticalLines - 1) / 2)) * bottomSpacing;
            ctx.beginPath();
            ctx.moveTo(x, canvasHeight - bottomOffset);
            ctx.lineTo(x + spacing, canvasHeight);
            ctx.closePath();
            ctx.stroke();
        }
        for(let i = 0; i < horizontalLines; i++)
        {
            let offset = (i / (horizontalLines - 1)) + gridOffsetPercentage;
            if(offset > 1)
            {
                offset--;
            }
            let y = bottomOffset * offset + (canvasHeight - bottomOffset);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.closePath();
            ctx.stroke();
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
        if(params.showGrayscale)
        {
            let average = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = average;
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

export {setupCanvas,draw,updateGrid,updateBarPercent,updateSunPercent,updateAudioDataType};