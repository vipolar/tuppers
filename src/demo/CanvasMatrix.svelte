<script>
    import { getPixelsOnTheLine, findTouchIndexById, copyCanvasTouch } from './Tools.js'
    import { isInBrushMode, kValueStringBin } from './Stores.js';

    /* create 2D array and populate it with '0's */
	let kValueArray = new Array(106);
	for (let i = 0; i < kValueArray.length; i++) {
		kValueArray[i] = new Array(17);
		for (let j = 0; j < kValueArray[i].length; j++) {
			kValueArray[i][j] = '0';
		}
    };

	export let pixelSize;
    const ongoingTouches = [];
	let isPointerDown = false;
    let isValueUpToDate = true;
    let isInCanvasMode = true;
	let isInDebugMode = true;
    let isBrushAtive = true;
	let kValueString = '';

    /* create final string of k's binary value */
    $: if (isPointerDown === true) {
        isValueUpToDate = false;
    } else {
        if (isValueUpToDate === false) {
            kValueString = '';
            for (let i = 0; i < kValueArray.length; i++) {
                for (let j = 0; j < kValueArray[i].length; j++) {
                    kValueString += kValueArray[i][j];
                }
            }

            /* export the final binary string for others to access */
            kValueStringBin.update(n => kValueString);
            isValueUpToDate = true;
        }
    }

    /* actually painting, can you imagine?! */
    isInBrushMode.subscribe(value => {
		isBrushAtive = value;
    });

    function matrixFillPixel(x, y) {
        let pixelCol = x;
        let pixelRow = 16 - y; /* 16 to reverse */
        let pixelID = `pixel-${pixelCol}-${pixelRow}`;
        let pixelElement = document.getElementById(pixelID);

        if (isBrushAtive) {
			pixelElement.style.backgroundColor = "#ff0000";
			kValueArray[pixelCol][pixelRow] = '1';
		} else {
			pixelElement.style.backgroundColor = "#999999";
			kValueArray[pixelCol][pixelRow] = '0';
		}

        pixelElement.style.backgroundColor = "#ff0000";
    };
    
    /* wake up babe, new events just dropped! */
    function handleCanvasPointerDown(e) {
        log(`pointerdown: id = ${e.pointerId}.`);
        ongoingTouches.push(copyCanvasTouch(e));
        isPointerDown = true;
        
        /* calculate the PseudoPixel coordinates */
        let pixelCol = Math.floor(e.layerX / pixelSize);
        let pixelRow = Math.floor(e.layerY / pixelSize);
        
        log(`start drawing at: ${pixelCol}, ${pixelRow}.`);
        matrixFillPixel(pixelCol, pixelRow);  
    };

    function handleCanvasPointerMove(e) {
        if (!isPointerDown)
            return;

        /* find the touchID that is being continued here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index < 0) {
            log(`can't figure out which touch to continue`);
        } else {
            log(`continuing ongoing touch: index = ${index}.`);

            /* get an array of all PseudoPixels on the traversed line */
            let pixelArray = getPixelsOnTheLine(ongoingTouches[index].layerX, ongoingTouches[index].layerY, e.layerX, e.layerY, pixelSize);
            
            /* fill the line */
            if (pixelArray.length > 0) {
                log(`drawing line from: ${pixelArray[0]}.`);
                for (let i = 0; i < pixelArray.length; i++) {
                    let pixelCol = pixelArray[i][0];
                    let pixelRow = pixelArray[i][1];

                    if (pixelCol > 105 || pixelRow > 16 || pixelRow < 0 || pixelCol < 0) {
                        log(`canceled: ${pixelCol}, ${pixelRow} out of bounds!`);
                        isPointerDown = false;
                        break;
                    }

                    matrixFillPixel(pixelCol, pixelRow);
                }
                log(`drawing line to: ${pixelArray[pixelArray.length - 1]}.`);
            }

            /* swap in the new touch record */
            ongoingTouches.splice(index, 1, copyCanvasTouch(e));
        }
    };

    function handleCanvasPointerUp(e) {
        log(`pointerup: id = ${e.pointerId}`);
        isPointerDown = false;

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);
        
        if (index < 0) {
            log(`can't figure out which touch to end`);
        } else {
            log(`ending ongoing touch: index =  ${index}.`);

            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
            isPointerDown = false;
        }
    };

    function handleCanvasPointerLeave(e) {
        log(`pointerleave: id = ${e.pointerId}`);
        isPointerDown = false;

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index < 0) {
            log(`can't figure out which touch to end`);
        } else {
            log(`ending ongoing touch: index =  ${index}.`);

            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    }

    function handleCanvasPointerCancel(e) {
        log(`pointercancel: id = ${e.pointerId}`);
        isPointerDown = false;

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index < 0) {
            log(`can't figure out which touch to end`);
        } else {
            log(`ending touch: index =  ${index}.`);

            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    };

    function handleCanvasDragStart(e) {
        isPointerDown = false;
		e.preventDefault();
	};

    /* bop it twist it pull it log it */
    function log(msg) {
        const container = document.getElementById('log');
        container.textContent = `${ msg } \n${ container.textContent }`;
    };
</script>


<!--constants in braces represent the amount of pixels, as defined here-->
<div id="matrix" class="matrix" style="width: {106 * pixelSize}px; height: {17 * pixelSize}px">
	{#each Array(106) as _, indexCol (indexCol)}
		<div class="matrix-column" style="width: {pixelSize}px; height: {17 * pixelSize}px">
			{#each Array(17) as _, indexPix (indexPix)}
				<div id="pixel-{indexCol}-{indexPix}" class="matrix-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
			{/each}
		</div>
	{/each}

	{#if isInCanvasMode}
		<!--canvas overlay cuts down on many hurdles otherwise encountered with painting on matrix-->
		<canvas id="canvas" class="matrix-canvas" width="{106 * pixelSize}" height="{17 * pixelSize}"
			on:pointerdown={handleCanvasPointerDown} on:pointermove={handleCanvasPointerMove} on:pointerup={handleCanvasPointerUp}
			on:pointerleave={handleCanvasPointerLeave} on:pointercancel={handleCanvasPointerCancel} on:dragstart={handleCanvasDragStart}>
				<b><i>Your browser does not support canvas element.</i></b>
		</canvas>
	{/if}

    {#if isInDebugMode}<!--comprehensive debugging system and other jokes to tell yourself-->
    	<pre id="log" class="matrix-log" style="bottom: 0; left: 0; height: {8 * pixelSize}px;"></pre>
	{/if}
</div>

<style>
    :root {
        --matrix-box-shadow: #990000;
        --matrix-pixel-box-shadow: #ffffff;
        --matrix-pixel-background-color: #999999;
        --matrix-pixel-box-shadow-hover: #ff0000;
        --matrix-pixel-background-color-hover: #ffa500;
    }

    .matrix {
		box-shadow: 0px 0px 2px var(--matrix-box-shadow);
		display: flex;
	}

	.matrix-canvas {
        background: transparent;
        position: absolute;
        touch-action: none;
        display: block;
        left: 0;
        top: 0;
    }

    .matrix-column {
        flex-direction: column-reverse;
        display: inherit;
    }

	.matrix-pixel {
		box-shadow: 0px 0px 1px var(--matrix-pixel-box-shadow);
		background-color: var(--matrix-pixel-background-color);	
		float: left;		
	}

    .matrix-log {        
        border: 1px solid #cccccc;
        background: transparent;
        position: absolute;
        overflow: scroll;
        display: block;
        height: 200px;
        width: 300px;
        margin: 0;
    }
</style>