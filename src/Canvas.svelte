<script>
    import { setCharAt,
        kValueValidate,
        kValueBaseToBinary,
        kValueBinaryToBase,
        getPixelsOnTheLine,
        findTouchIndexById,
        copyCanvasTouch
    } from './demo/Tools.js'

    //const kValueBinaryToBaseDebounced = debounceFunction(kValueBinaryToBase, 330);
    let kValueString = 'Click on the canvas and see what happens to me!';
	let kValueBinary = '0'.repeat(1802);
    let kValueBase = 'dec';
    
    const ongoingTouches = [];
	let isPointerDown = false;
    let isInBrushMode = true;
    let pixelSize = 0;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    /* needs a tonne of work! */
    if (windowWidth > windowHeight) {
        let w = Math.floor(windowWidth / 116);
        let h = Math.floor(windowHeight / 33);
        pixelSize = w > h ? h : w;
        pixelSize = pixelSize <= 16 ? pixelSize : 16;
        pixelSize = pixelSize >= 4 ? pixelSize : 4;
    } else { /* portrait mode */
        let w = Math.floor(windowWidth / 33);
        let h = Math.floor(windowHeight / 116)
        pixelSize = w > h ? h : w;
        pixelSize = pixelSize <= 16 ? pixelSize : 16;
        pixelSize = pixelSize >= 4 ? pixelSize : 4;
    }

    /* we do paintin' here yo! */
    function canvasFillPattern(k) {
        let pixelCol = 0;
        let pixelRow = 0;
        let pixelElement;

        if (k.length !== 1802 || k === kValueBinary)
            return;

        for (let i = 0; i < 1802; pixelRow++, i++) {
            if (i > 0 && i % 17 === 0) {
                pixelRow = 0;
                pixelCol++;
            }

            /* a bit heavy on the system but fullproof as hell! */
            pixelElement = document.getElementById(`pixel-${pixelCol}-${pixelRow}`);

            if (k[i] === '1') {
                kValueBinary = setCharAt(kValueBinary, pixelCol * 17 + pixelRow, '1');
                pixelElement.classList.add("canvas-pixel-active");
            } else {
                kValueBinary = setCharAt(kValueBinary, pixelCol * 17 + pixelRow, '0');
                pixelElement.classList.remove("canvas-pixel-active");
            }
        }
    };

    function canvasFillPixel(x, y) {
        let pixelCol = x;
        let pixelRow = 16 - y; /* 16 to reverse */
        let pixelID = `pixel-${pixelCol}-${pixelRow}`;
        let pixelElement = document.getElementById(pixelID);

        if (isInBrushMode) {
            kValueBinary = setCharAt(kValueBinary, pixelCol * 17 + pixelRow, '1');
            pixelElement.classList.add("canvas-pixel-active");            
		} else {
            kValueBinary = setCharAt(kValueBinary, pixelCol * 17 + pixelRow, '0');
            pixelElement.classList.remove("canvas-pixel-active");
		}

        let timer;
        clearTimeout(timer);
        timer = setTimeout(() => {
            kValueString = kValueBinaryToBase(kValueBinary, kValueBase);
        }, 100);
    };
    
    /* wake up babe, new events just dropped! */
    function handleCanvasPointerDown(e) {
        //console.log(`pointerdown: id = ${e.pointerId}.`);
        e.target.classList.add("canvas-active");
        e.target.classList.remove("canvas-error");
        e.target.classList.remove("canvas-success");

        ongoingTouches.push(copyCanvasTouch(e));
        isPointerDown = true;
        
        /* calculate the PseudoPixel coordinates */
        let pixelCol = Math.floor(e.layerX / pixelSize);
        let pixelRow = Math.floor(e.layerY / pixelSize);
        
        //console.log(`start drawing at: ${pixelCol}, ${pixelRow}.`);
        canvasFillPixel(pixelCol, pixelRow);  
    };

    function handleCanvasPointerMove(e) {
        if (!isPointerDown)
            return;

        /* find the touchID that is being continued here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index >= 0) {
            //console.log(`continuing ongoing touch: index = ${index}.`);

            /* get an array of all PseudoPixels on the traversed line */
            let pixelArray = getPixelsOnTheLine(ongoingTouches[index].layerX, ongoingTouches[index].layerY, e.layerX, e.layerY, pixelSize);
            
            /* fill the line */
            if (pixelArray.length > 0) {
                //console.log(`drawing line from: ${pixelArray[0]}.`);
                for (let i = 0; i < pixelArray.length; i++) {
                    let pixelCol = pixelArray[i][0];
                    let pixelRow = pixelArray[i][1];

                    if (pixelCol > 105 || pixelRow > 16 || pixelRow < 0 || pixelCol < 0) {
                        //console.log(`canceled: ${pixelCol}, ${pixelRow} out of bounds!`);
                        isPointerDown = false;
                        break;
                    }

                    canvasFillPixel(pixelCol, pixelRow);
                }
                //console.log(`drawing line to: ${pixelArray[pixelArray.length - 1]}.`);
            }

            /* swap in the new touch record */
            ongoingTouches.splice(index, 1, copyCanvasTouch(e));
        }
    };

    function handleCanvasPointerUp(e) {
        if (!isPointerDown)
            return false;

        isPointerDown = false;
        e.target.classList.add("canvas-success");
        e.target.classList.remove("canvas-error");
        e.target.classList.remove("canvas-active");
        setTimeout(() => {e.target.classList.remove("canvas-success");}, 330);

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index >= 0) {
            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    };

    function handleCanvasPointerLeave(e) {
        if (!isPointerDown)
            return false;

        isPointerDown = false;
        e.target.classList.add("canvas-error");
        e.target.classList.remove("canvas-active");
        e.target.classList.remove("canvas-success");
        setTimeout(() => {e.target.classList.remove("canvas-error");}, 330);

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index >= 0) {
            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    };

    function handleCanvasPointerCancel(e) {
        if (!isPointerDown)
            return false;

        isPointerDown = false;
        e.target.classList.add("canvas-error");
        e.target.classList.remove("canvas-active");
        e.target.classList.remove("canvas-success");
        setTimeout(() => {e.target.classList.remove("canvas-error");}, 330);

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index >= 0) {
            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    };

    function handleCanvasDragStart(e) {
        isPointerDown = false;
		e.preventDefault();
        return false;
	};

    /* k-value and its posse */
    function kValueDisplayButton() {
        if (kValueBase === 'b64') {  
            kValueBase = 'dec';
        } else if (kValueBase === 'dec') {
            kValueBase = 'bin';
        } else if (kValueBase === 'bin') {
            kValueBase = 'b64';
        } else { /* default */
            kValueBase = 'dec';
        }

        kValueString = kValueBinaryToBase(kValueBinary, kValueBase);
	};

    function kValueCopyButton() {
        const targetElement = document.getElementById("textarea");
        targetElement.classList.remove("canvas-success");
        targetElement.classList.remove("canvas-error");
        targetElement.classList.add("canvas-active");
        navigator.clipboard.writeText(kValueString);

        setTimeout(() => { /* clean up after */
            targetElement.classList.remove("canvas-success");
            targetElement.classList.remove("canvas-active");
            targetElement.classList.remove("canvas-error");
        }, 500);
    };

    function kValuePasteButton(e) {
        let kValueStringTemp = '';

        if (typeof navigator.clipboard.readText === "function") {
            navigator.clipboard.readText().then(clipText => kValueStringTemp = clipText);
            if (kValueStringTemp.length > 0) {
                kValueString = kValueStringTemp;
                kValueChangeHandler();
            } else {
                alert('Clipboard is empty or the access to it was denied.');
            }
        } else {
            alert('Browser does not support non-manual access to clipboard.');
            e.target.disabled = true;
        }
    };

    function kValueCommentButton() {
        alert('TODO!');
    };

    function kValueChangeHandler() {    
        /* general stuff applicable to every type of events applicable here */
        const kValueBinaryTemp = kValueBaseToBinary(kValueString, kValueBase);
        const targetElement = document.getElementById('textarea');
        const kValueIsValid = kValueValidate(kValueBinaryTemp);

        if (kValueIsValid) {
            targetElement.classList.remove("canvas-active");
            targetElement.classList.remove("canvas-error");
            targetElement.classList.add("canvas-success");
        } else {
            targetElement.classList.remove("canvas-success");
            targetElement.classList.remove("canvas-active");
            targetElement.classList.add("canvas-error");
        }
        
        /* triggered on focusout and paste button events*/
        if (document.activeElement !== targetElement) {
            if (kValueIsValid) {
                /* finally bake in the new binary value (everywhere) */
                kValueString = kValueBinaryToBase(kValueBinaryTemp, kValueBase);
                canvasFillPattern(kValueBinaryTemp);
            } else {
                /* revert to the last good k-value available */
                kValueString = kValueBinaryToBase(kValueBinary, kValueBase);
            }

            setTimeout(() => { /* clean up after */
                targetElement.classList.remove("canvas-success");
                targetElement.classList.remove("canvas-active");
                targetElement.classList.remove("canvas-error");
            }, 330);
        }
    };
</script>

<div class="container" style="width: {116 * pixelSize}px; height: {34 * pixelSize}px">
    <div id="frame" class="frame" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px">
        <div id="greater-canvas" class="greater-canvas" style="--pixelSize: {pixelSize}px;">
            {#each Array(5) as _, indexCol (indexCol)}
                <div class="column">
                    {#each Array(27) as _, indexPix (indexPix)}
                        <div class="pixel frame-pixel"></div>
                    {/each}
                </div>
            {/each}
            {#each Array(106) as _, indexCol (indexCol)}
                <div class="column">
                    {#each Array(5) as _, indexPix (indexPix)}
                        <div class="pixel frame-pixel"></div>
                    {/each}
                    {#each Array(17) as _, indexPix (indexPix)}
                        <div id="pixel-{indexCol}-{indexPix}" class="pixel canvas-pixel"></div>
                    {/each}
                    {#each Array(5) as _, indexPix (indexPix)}
                        <div class="pixel frame-pixel"></div>
                    {/each}
                </div>
            {/each}
            {#each Array(5) as _, indexCol (indexCol)}
                <div class="column">
                    {#each Array(27) as _, indexPix (indexPix)}
                        <div class="pixel frame-pixel"></div>
                    {/each}
                </div>
            {/each}
        </div>

        <!--actual painting happens here and is translated onto pixels underneath afterwards-->
        <canvas id="canvas" class="canvas" width="{106 * pixelSize}" height="{17 * pixelSize}" style="top: {5 * pixelSize}px; left: {5 * pixelSize}px;"
                on:pointerdown={handleCanvasPointerDown} on:pointermove={handleCanvasPointerMove} on:pointerup={handleCanvasPointerUp}
                on:pointerleave={handleCanvasPointerLeave} on:pointercancel={handleCanvasPointerCancel} on:dragstart={handleCanvasDragStart}>
                    <b><i>Your browser does not support canvas element.</i></b>
        </canvas>

        <!--gradient decore for the frame around the canvas-->
        <div class="canvas-overlay-left-gradient" style="width: {5 * pixelSize}px; height: {27 * pixelSize}px"></div>
        <div class="canvas-overlay-top-gradient" style="width: {116 * pixelSize}px; height: {5 * pixelSize}px"></div>
        <div class="canvas-overlay-right-gradient" style="width: {5 * pixelSize}px; height: {27 * pixelSize}px"></div>
        <div class="canvas-overlay-bot-gradient" style="width: {116 * pixelSize}px; height: {5 * pixelSize}px"></div>

        <!--font-size adjustments might be harmful, need testing on mobile devices-->
        <div class="canvas-overlay-axis-y" style="width: {5 * pixelSize}px; height: {27 * pixelSize}px">
            <div class="canvas-overlay-axis-y-arrow-body"></div>
            <div class="canvas-overlay-axis-y-arrow-head" style="width: {pixelSize}px; height: {pixelSize}px; top: {pixelSize / 5}px"></div>
            <div class="canvas-overlay-axis-y-arrow-rest" style="width: {5 * pixelSize}px; height: {22 * pixelSize}px">
                <div class="canvas-overlay-axis-y-arrow-rest-name" style="font-size: {pixelSize / 10}em; right: {pixelSize * -1.5}px; top: {pixelSize}px"><b>Y</b></div> 
                <div class="canvas-overlay-axis-y-arrow-rest-dash" style="width: {5 * pixelSize}px; height: {17 * pixelSize}px">
                    <div class="canvas-overlay-axis-y-arrow-rest-dash-first" style="font-size: {pixelSize / 10}em; right: {pixelSize / 2}px; bottom: {pixelSize / 5}px"><b><i>k</i></b></div>
                    <div class="canvas-overlay-axis-y-arrow-rest-dash-last" style="font-size: {pixelSize / 10}em; right: {pixelSize / 2}px; top: {pixelSize * -1}px"><b><i>k+17</i></b></div>
                </div>
            </div>
        </div>

        <!--font-size adjustments might be harmful, need testing on mobile devices-->
        <div class="canvas-overlay-axis-x" style="width: {116 * pixelSize}px; height: {5 * pixelSize}px">
            <div class="canvas-overlay-axis-x-arrow-body"></div> 
            <div class="canvas-overlay-axis-x-arrow-head" style="width: {pixelSize}px; height: {pixelSize}px; right: {pixelSize / 5}px"></div>
            <div class="canvas-overlay-axis-x-arrow-rest" style="width: {111 * pixelSize}px; height: {5 * pixelSize}px">
                <div class="canvas-overlay-axis-x-arrow-rest-name" style="font-size: {pixelSize / 10}em; right: {pixelSize * 1.3}px; top: {pixelSize * -2}px"><b>X</b></div> 
                <div class="canvas-overlay-axis-x-arrow-rest-dash" style="width: {106 * pixelSize}px; height: {5 * pixelSize}px">
                    <div class="canvas-overlay-axis-x-arrow-rest-dash-first" style="font-size: {pixelSize / 10}em; left: {pixelSize / 5}px"><b><i>0</i></b></div>
                    <div class="canvas-overlay-axis-x-arrow-rest-dash-last" style="font-size: {pixelSize / 10}em; right: {pixelSize * -1}px"><b><i>106</i></b></div>
                </div>
            </div>
        </div>
    </div>

    <!--k-value textarea, buttons and stuff-->
    <div class="k-buttons" style="width: {96 * pixelSize}px; height: {6 * pixelSize}px; padding-top: {pixelSize / 2}px; padding-bottom: {pixelSize / 2}px;">
        <div  class="k-buttons-value" style="width: {96 * pixelSize}px; height: {2.5 * pixelSize}px">
            <button on:click={kValueDisplayButton} type="button" style="font-size: {2 * pixelSize - 4}px; width: {8 * pixelSize}px; height: {2.5 * pixelSize}px"><i>k<sub>{kValueBase}</sub></i></button>
            <textarea bind:value={kValueString} on:input={kValueChangeHandler} on:focusout={kValueChangeHandler} id="textarea" style="line-height: {2.5 * pixelSize - 1}px; font-size: {2 * pixelSize - 6}px; width: {88 * pixelSize}px; height: {2.5 * pixelSize}px"></textarea>
        </div>
         <div class="k-buttons-action" style="width: {96 * pixelSize}px; height: {2.5 * pixelSize}px">
            <button on:click={kValueCommentButton} class="k-buttons-action-comment" type="button" style="font-size: {2 * pixelSize - 6}px; width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">Comment</button>          
            <button on:click={kValuePasteButton} class="k-buttons-action-paste" type="button" style="font-size: {2 * pixelSize - 6}px; width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">Paste</button>
            <button on:click={kValueCopyButton} class="k-buttons-action-copy" type="button" style="font-size: {2 * pixelSize - 6}px; width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">Copy</button>
            <div class="k-buttons-action-options" style="width: {50 * pixelSize}px; height: {2.5 * pixelSize}px">
                <button class="k-buttons-action-options-tutorial" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
                <button class="k-buttons-action-options-select" type="button" style="font-size: {2 * pixelSize - 6}px; width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
                <button class="k-buttons-action-options-clear" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
            </div>
        </div>
    </div>

    <!--dummy to hoist ignored css classes upon (this classes are not active by default, thus ignored by compiler)-->
    <div class="canvas-error canvas-active canvas-success canvas-pixel-active" style="display: none;"></div>
</div>

<style>
    .container {
        transform-style: preserve-3D;
        transform-origin: left top;
        position: absolute;
        align-self: center;
        margin-right: auto;
        margin-left: auto;
        right: 0;
        left: 0;
    }

    .frame {
        position: relative;
        display: block;
    }

    .greater-canvas {
        flex-flow: row wrap-reverse;
        display: flex;
	}

    .canvas {
        box-shadow: 0 0 5px var(--canvas-box-shadow);
        touch-action: pinch-zoom;
        background: transparent;
        transition: all 0.125s;
        position: absolute;
        display: block;
    }

    .canvas-error {
        transition: all 0s;
        box-shadow: 0 0 20px var(--canvas-box-shadow-error);
    }

    .canvas-active {
        box-shadow: 0 0 10px var(--canvas-box-shadow-active);
    }

    .canvas-success {
        box-shadow: 0 0 10px var(--canvas-box-shadow-success);
    }    

    .column {
        flex-flow: column-reverse wrap-reverse;
        display: inherit;
    }

    .pixel {
        height: var(--pixelSize);
        width: var(--pixelSize);
        float: left;
    }

    .frame-pixel {
        box-shadow: 0px 0px 1px var(--frame-pixel-box-shadow);
        background-color: var(--frame-pixel-background);	
    }

    .canvas-pixel {
        box-shadow: 0px 0px 1px var(--canvas-pixel-box-shadow);
        background-color: var(--canvas-pixel-background);
        transition: all 0.25s;
    }

    .canvas-pixel-active {	
        box-shadow: 0px 0px 1px var(--canvas-pixel-box-shadow-active);
        background-color: var(--canvas-pixel-background-active);
    }

    .canvas-overlay-left-gradient {
		background-image: linear-gradient(to left, var(--canvas-overlay-gradient-start), var(--canvas-overlay-gradient-finish));
		position: absolute;
        left: 0;
        top: 0;
	}

    .canvas-overlay-top-gradient {
		background-image: linear-gradient(to top, var(--canvas-overlay-gradient-start), var(--canvas-overlay-gradient-finish));
		position: absolute;
        top: 0;
	}

    .canvas-overlay-right-gradient {
		background-image: linear-gradient(to right, var(--canvas-overlay-gradient-start), var(--canvas-overlay-gradient-finish));
		position: absolute;
        right: 0;
        top: 0;
	}

	.canvas-overlay-bot-gradient {
		background-image: linear-gradient(to bottom, var(--canvas-overlay-gradient-start), var(--canvas-overlay-gradient-finish));
		position: absolute; 
        bottom: 0;
	}

    .canvas-overlay-axis-y {
		position: absolute;
        left: 0;
        top: 0;
    }

    .canvas-overlay-axis-y-arrow-body {
        border-left: 2px solid var(--canvas-overlay-decore-arrow-line);
		position: absolute;
        height: inherit;
		right: -1px;
    }

    .canvas-overlay-axis-y-arrow-head {
        left: 100%;
        float: right;
        position: absolute;
        transform: translateX(-50%) rotate(-45deg);
        border-top: 2px solid var(--canvas-overlay-decore-arrow-line);
        border-right: 2px solid var(--canvas-overlay-decore-arrow-line);
        /* Hacky as fuck but it somehow works, so fuck off! */
    }

    .canvas-overlay-axis-y-arrow-rest {
        position: absolute;
        left: 0;
        top: 0;
    }

    .canvas-overlay-axis-y-arrow-rest-name {
        color: var(--canvas-overlay-decore-arrow-legend);
        position: absolute;
    }

    .canvas-overlay-axis-y-arrow-rest-dash {
        position: absolute;
        text-align: right;
        bottom: 0;
        left: 0;
    }

    .canvas-overlay-axis-y-arrow-rest-dash-first {
        color: var(--canvas-overlay-decore-arrow-legend);
        position: absolute;
        bottom: 0;
    }

    .canvas-overlay-axis-y-arrow-rest-dash-last {
        color: var(--canvas-overlay-decore-arrow-legend);
        position: absolute;
    }

    .canvas-overlay-axis-x {
		position: absolute;
        bottom: 0;
    }

    .canvas-overlay-axis-x-arrow-body {
        border-bottom: 2px solid var(--canvas-overlay-decore-arrow-line);
		position: absolute;
        width: inherit;
    }

    .canvas-overlay-axis-x-arrow-head {
        top: 1px;
        float: right;
        position: absolute;
        transform: translateY(-50%) rotate(45deg);
        border-top: 2px solid var(--canvas-overlay-decore-arrow-line);
        border-right: 2px solid var(--canvas-overlay-decore-arrow-line);
        /* Hacky as fuck but it somehow works, so fuck off! */
    } 

    .canvas-overlay-axis-x-arrow-rest {
        position: absolute;
        right: 0;
        top: 0;
    }

    .canvas-overlay-axis-x-arrow-rest-name {
        color: var(--canvas-overlay-decore-arrow-legend);
        position: absolute;
    }

    .canvas-overlay-axis-x-arrow-rest-dash {
        position: absolute;
        text-align: left;
        bottom: 0;
        left: 0;
    }

    .canvas-overlay-axis-x-arrow-rest-dash-first {
        color: var(--canvas-overlay-decore-arrow-legend);
        position: absolute;
        top: 0;
    }

    .canvas-overlay-axis-x-arrow-rest-dash-last {
        color: var(--canvas-overlay-decore-arrow-legend);
        position: absolute;
        top: 0;
    }   

    .k-buttons {
        position: relative;
        margin-right: auto;
        margin-left: auto;
        display: block;
    }

    .k-buttons-value {
        margin-bottom: 3px;
        display: flex;
    }

    .k-buttons-value button {
        border-bottom-right-radius: 0;
        border-top-right-radius: 0;
    }

    .k-buttons-value textarea {
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-left: 3px;
        border-left: none;
        overflow: hidden;
        resize: none;
    }

    .k-buttons-action {
        flex-direction: row-reverse;
        display: flex;
    }

    .k-buttons-action > * {
        margin-left: 5px;
    }

    .k-buttons-action-options {
        flex-direction: row;
        display: flex;
    }

    .k-buttons-action-options > * {
        background-repeat: no-repeat;
        background-size: contain;
        border-radius: 100%;
        contain: content;
        margin-left: 5px;
    }

    .k-buttons-action-options-tutorial {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBVcGxvYWRlZCB0byBTVkdSZXBvIGh0dHBzOi8vd3d3LnN2Z3JlcG8uY29tIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9Il94MzFfIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMTI4IDEyOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTI4IDEyODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8cGF0aCBpZD0iX3gzMV9fMV8iIGQ9Ik05Ny4yLDUxaC02LjRsLTYsMTAuMWMwLDAtNi4xLTkuOS02LjYtOS45cy02LjUsOS45LTYuNSw5LjlMNjUuNiw1MWgtMi45Yy00LjgsMC05LjcsMS45LTEzLjQsNS42TDM5LjIsNjYuNwoJbC05LjQtMjAuNGMtMS41LTMuMy00LjItNS43LTcuNi02LjlzLTctMS4xLTEwLjQsMC40Yy01LjYsMi41LTgsOS4yLTUuMywxNC43bDE1LjMsMzIuNmwtMS43LDEuN2MtMi41LDIuNy0yLjUsNi44LDAuMSw5LjMKCWMyLDIsNC45LDIuNCw3LjQsMS4zbDAuOCwxLjdsMCwwYzEuNiwzLjIsNC45LDUuMiw4LjQsNS4yYzAuNCwwLDAuOCwwLDEuMi0wLjFsMi41LDUuNmMwLjMsMC43LDAuOSwwLjksMS41LDAuOQoJYzAuMywwLDAuNSwwLDAuNy0wLjFjOC4yLTMuOCwxMS44LTEzLjcsOC0yMS44bDAsMGwwLDBsLTUuMy0xMS4zbDguOS04LjljMC40LTAuNCwwLjgtMC41LDEuMy0wLjVjMS4xLDAsMS45LDAuOCwxLjksMS43djUxLjFoNDEuNQoJVjczLjdjMC0xLjEsMC44LTEuOSwxLjktMS45czEuOSwwLjgsMS45LDEuOXY0Mi42YzAsMy43LDIuOSw2LjYsNi42LDYuNmMzLjcsMCw2LjYtMi45LDYuNi02LjZWNzBDMTE2LjEsNTkuNSwxMDcuNiw1MSw5Ny4yLDUxegoJIE0yNC40LDg0LjZMMTIuNiw1OS41YzIuMSwwLjUsNC4yLDAuNCw2LjItMC41YzMuOC0xLjksNS42LTYuNCwzLjctMTAuMmMtMS41LTMuMi01LjQtNC42LTguNi0zLjJjLTAuOCwwLjQtMS4yLDEuMy0wLjgsMi4zCgljMC40LDAuOCwxLjMsMS4yLDIuMywwLjhjMS42LTAuOCwzLjUsMCw0LjIsMS42YzEuMSwyLjEsMC4xLDQuOC0yLjEsNS44Yy0xLjUsMC43LTMuMSwwLjgtNC41LDAuMWMtMS41LTAuNS0yLjctMS42LTMuMy0zLjEKCWMtMS45LTMuOC0wLjEtOC41LDMuNy0xMC40YzIuNC0xLjIsNS4yLTEuMyw3LjctMC40YzIuNSwwLjksNC41LDIuOCw1LjcsNS4zYzMuMSw2LjUsMC4zLDE0LjMtNi40LDE3LjRjLTAuOCwwLjQtMS4yLDEuMy0wLjgsMi4zCglsNy42LDE1LjhDMjYuMSw4My40LDI1LjIsODMuOSwyNC40LDg0LjZ6IE0zMS4zLDk5LjdMMzEuMyw5OS43bC0xLjEtMi40bDIuNC0yLjRsMy44LDguMUMzNC4zLDEwMi45LDMyLjIsMTAxLjcsMzEuMyw5OS43egoJIE00Ny42LDkyLjFMNDcuNiw5Mi4xYzIuOCw2LjEsMC43LDEzLjEtNC45LDE2LjZsLTgtMTdjMC44LTIuNCwwLjMtNS0xLjYtNi45Yy0wLjctMC43LTEuNS0xLjItMi40LTEuNWwtNy40LTE2LjIKCWM0LTIuNCw2LjYtNi40LDcuNi0xMC43TDQ3LjYsOTIuMUw0Ny42LDkyLjF6Ii8+CjxjaXJjbGUgY3g9Ijc5IiBjeT0iMzEuMiIgcj0iMTUuNCIvPgo8L3N2Zz4K);
    }

    .k-buttons-action-options-select {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMi42NzE5IDIuNzU5NjFMMTQuNTE2MyA2LjUwNEwxMy43NSA2LjUwNDk1TDEzLjY0OTMgNi41MDgzNEwxMy41NDc1IDYuNTE1MThMMTMuNDQ2NiA2LjUyNTQyTDEzLjI4OTggNi41NTIzMUMxMi4yNTgyIDYuNzY2OTQgMTEuNSA3LjY3OTQ1IDExLjUgOC43NTQ5NUMxMS41IDkuOTIwMjQgMTIuMzg1OCAxMC44Nzg2IDEzLjUyMDkgMTAuOTkzNEwxMy42NzcxIDExLjAwMzhMMTMuNjQ5MyAxMS4wMDM0TDEzLjU0NzUgMTEuMDEwMkwxMy40NDY2IDExLjAyMDVMMTMuMjg5OCAxMS4wNDc0QzEyLjMxMjUgMTEuMjUwNyAxMS41ODA2IDEyLjA4MDQgMTEuNTA2MiAxMy4wODE2TDExLjUgMTMuMjVMMTEuNTA1MiAxMy40MDRDMTEuNTgwOCAxNC41MjE2IDEyLjQ3MjQgMTUuNDE1NCAxMy41ODkgMTUuNDk0M0wxMy43NSAxNS41TDE0IDE1LjUwMUwxMy43NSAxNS41MDE1TDEzLjY0OTMgMTUuNTA0OUwxMy41NDc1IDE1LjUxMTdMMTMuNDQ2NiAxNS41MjE5TDEzLjI4OTggMTUuNTQ4OEMxMi4zMTI1IDE1Ljc1MjIgMTEuNTgwNiAxNi41ODE4IDExLjUwNjIgMTcuNTgzMUwxMS41IDE3Ljc1MTVMMTEuNTA1MiAxNy45MDU1QzExLjUyNDEgMTguMTg0OCAxMS41OTM5IDE4LjQ1MDEgMTEuNzA1NSAxOC42OTIzTDYuNjI1NjQgMjEuMzY4MkM2LjA3NTE3IDIxLjY1ODEgNS40MzEzNSAyMS4xOTA0IDUuNTM3MDEgMjAuNTc3Mkw2LjU2ODQgMTQuNTkyMUwyLjIxNjAyIDEwLjM1NjNDMS43NzAxNSA5LjkyMjM0IDIuMDE2MDYgOS4xNjU0OSAyLjYzMTg0IDkuMDc2NTFMOC42NDI3NSA4LjIwNzkxTDExLjMyNjMgMi43NTk2MUMxMS42MDEyIDIuMjAxNDcgMTIuMzk3IDIuMjAxNDcgMTIuNjcxOSAyLjc1OTYxWk0yMS4yNSAxNy4wMDE1QzIxLjY2NDIgMTcuMDAxNSAyMiAxNy4zMzczIDIyIDE3Ljc1MTVDMjIgMTguMTMxMiAyMS43MTc4IDE4LjQ0NSAyMS4zNTE4IDE4LjQ5NDZMMjEuMjUgMTguNTAxNUgxMy43NUMxMy4zMzU4IDE4LjUwMTUgMTMgMTguMTY1NyAxMyAxNy43NTE1QzEzIDE3LjM3MTggMTMuMjgyMiAxNy4wNTggMTMuNjQ4MiAxNy4wMDgzTDEzLjc1IDE3LjAwMTVIMjEuMjVaTTIxLjI1IDEyLjVDMjEuNjY0MiAxMi41IDIyIDEyLjgzNTggMjIgMTMuMjVDMjIgMTMuNjI5NyAyMS43MTc4IDEzLjk0MzUgMjEuMzUxOCAxMy45OTMyTDIxLjI1IDE0SDEzLjc1QzEzLjMzNTggMTQgMTMgMTMuNjY0MiAxMyAxMy4yNUMxMyAxMi44NzAzIDEzLjI4MjIgMTIuNTU2NSAxMy42NDgyIDEyLjUwNjhMMTMuNzUgMTIuNUgyMS4yNVpNMjEuMjUgOC4wMDQ5NUMyMS42NjQyIDguMDA0OTUgMjIgOC4zNDA3NCAyMiA4Ljc1NDk1QzIyIDkuMTM0NjUgMjEuNzE3OCA5LjQ0ODQ1IDIxLjM1MTggOS40OTgxMUwyMS4yNSA5LjUwNDk1SDEzLjc1QzEzLjMzNTggOS41MDQ5NSAxMyA5LjE2OTE3IDEzIDguNzU0OTVDMTMgOC4zNzUyNiAxMy4yODIyIDguMDYxNDYgMTMuNjQ4MiA4LjAxMThMMTMuNzUgOC4wMDQ5NUgyMS4yNVoiIGZpbGw9IiMwMDAwMDAiLz4KPC9zdmc+Cg==);
    }

    .k-buttons-action-options-clear {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxnPg0KCQk8cGF0aCBkPSJNNDk1LjI3NiwxMzMuOTZMMzc3LjAzMiwxNS43MTVjLTE5LjYwNS0xOS42MDgtNTEuMzQtMTkuNjA5LTcwLjk0NiwwTDQwLjM3LDI4MS40MjgNCgkJCWMtMTkuNTU3LDE5LjU2LTE5LjU1Nyw1MS4zODYsMC4wMDEsNzAuOTQ2bDYxLjE1Myw2MS4xNTNjOS40NzUsOS40NzYsMjIuMDc0LDE0LjY5MywzNS40NzMsMTQuNjkzaDExNC4xODgNCgkJCWMxMy40LDAsMjUuOTk4LTUuMjE5LDM1LjQ3My0xNC42OTNsMjUuNjc4LTI1LjY3OHYtMC4wMDFsMTgyLjk0MS0xODIuOTQyQzUxNC44MzcsMTg1LjM0Nyw1MTQuODM3LDE1My41Miw0OTUuMjc2LDEzMy45NnoNCgkJCSBNMjYzLjAwOSwzODkuODc4Yy0zLjE1OCwzLjE1OC03LjM1OCw0Ljg5Ny0xMS44MjQsNC44OTdIMTM2Ljk5N2MtNC40NjcsMC04LjY2Ni0xLjczOS0xMS44MjQtNC44OTdsLTYxLjE1Mi02MS4xNTINCgkJCWMtNi41MjEtNi41MjEtNi41MjEtMTcuMTI5LTAuMDAxLTIzLjY1bDcwLjk0OC03MC45NDhsMTQxLjg5NSwxNDEuODk1TDI2My4wMDksMzg5Ljg3OHogTTQ3MS42MjksMTgxLjI1OGwtMzIuMTEzLDMyLjExMw0KCQkJTDI5Ny42MjIsNzEuNDc1bDMyLjExMy0zMi4xMTNjNi41MjItNi41MjEsMTcuMTI5LTYuNTE5LDIzLjY1LDBsMTE4LjI0NCwxMTguMjQ1DQoJCQlDNDc4LjE0OCwxNjQuMTI4LDQ3OC4xNDgsMTc0LjczNyw0NzEuNjI5LDE4MS4yNTh6Ii8+DQoJPC9nPg0KPC9nPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik00OTUuMjc4LDQ3Ny41NDZIMTYuNzIyQzcuNDg3LDQ3Ny41NDYsMCw0ODUuMDM0LDAsNDk0LjI2OXM3LjQ4NywxNi43MjIsMTYuNzIyLDE2LjcyMmg0NzguNTU1DQoJCQljOS4yMzUsMCwxNi43MjItNy40ODcsMTYuNzIyLTE2LjcyMlM1MDQuNTEzLDQ3Ny41NDYsNDk1LjI3OCw0NzcuNTQ2eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K);
    }
</style>