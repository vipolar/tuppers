<script>
    import { create2DMatrix, getPixelsOnTheLine, findTouchIndexById, copyCanvasTouch } from './Tools.js'
    import { kValueStringBin, BrushMode, CanvasMode } from './Stores.js';
    import { onMount } from 'svelte';
    export let pixelSize;

    /* create 2D array and populate it with '0's */
	let kValueArray = create2DMatrix(106, 17, '0');
	
    const ongoingTouches = [];
    let isInCanvasMode = false;
    let isValueUpToDate = true;
	let isPointerDown = false;
    let isInBrushMode = true;
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
            
            /* has to be made better!!! */
            kValueStringBin.update(n => kValueString);
            isValueUpToDate = true;
        }
    }
    
    onMount(() => {	/* paint whatever was there in the first place */
		const unsubscribe = kValueStringBin.subscribe(value => {
            kValueString = value;
            let pixelCol = 0;
            let pixelRow = 0;
            let pixelID = '';

            for (let i = 0, j = 0, k = 0; i < value.length; i++, j++, k++) {
                if (j === 17) {
                    pixelCol++;
                    j = 0;
                    k = 0;
                }
                
                pixelRow = k;
                pixelID = `pixel-${pixelCol}-${pixelRow}`;
                if (value[i] === '1') {
                    document.getElementById(pixelID).style.backgroundColor = "#000000";
                    kValueArray[pixelCol][pixelRow] = '1';
                } else {
                    document.getElementById(pixelID).style.backgroundColor = "#999999";
                    kValueArray[pixelCol][pixelRow] = '0';
                }
            }
        });

        return () => {
            unsubscribe();
		};
	});

    /* actually painting, can you imagine?! */
    CanvasMode.subscribe(value => {
        isInCanvasMode = value;
    });

    BrushMode.subscribe(value => {
        isInBrushMode = value;
    });

    function matrixFillPixel(x, y) {
        let pixelCol = x;
        let pixelRow = 16 - y; /* 16 to reverse */
        let pixelID = `pixel-${pixelCol}-${pixelRow}`;
        let pixelElement = document.getElementById(pixelID);

        if (isInBrushMode) {
            kValueArray[pixelCol][pixelRow] = '1';
			pixelElement.style.backgroundColor = "#383838";
            setTimeout(() => {pixelElement.style.backgroundColor = "#1a1a1a";}, 25);
            setTimeout(() => {pixelElement.style.backgroundColor = "#000000";}, 100);
		} else {
            kValueArray[pixelCol][pixelRow] = '0';
            pixelElement.style.backgroundColor = "#ffffff";
            setTimeout(() => {pixelElement.style.backgroundColor = "#dddddd";}, 25);
            setTimeout(() => {pixelElement.style.backgroundColor = "#999999";}, 100);
		}
    };
    
    /* wake up babe, new events just dropped! */
    function handleCanvasPointerDown(e) {
        //console.log(`pointerdown: id = ${e.pointerId}.`);
        ongoingTouches.push(copyCanvasTouch(e));
        isPointerDown = true;
        
        /* calculate the PseudoPixel coordinates */
        let pixelCol = Math.floor(e.layerX / pixelSize);
        let pixelRow = Math.floor(e.layerY / pixelSize);
        
        //console.log(`start drawing at: ${pixelCol}, ${pixelRow}.`);
        matrixFillPixel(pixelCol, pixelRow);  
    };

    function handleCanvasPointerMove(e) {
        if (!isPointerDown)
            return;

        /* find the touchID that is being continued here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index < 0) {
            //console.log(`can't figure out which touch to continue`);
        } else {
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

                    matrixFillPixel(pixelCol, pixelRow);
                }
                //console.log(`drawing line to: ${pixelArray[pixelArray.length - 1]}.`);
            }

            /* swap in the new touch record */
            ongoingTouches.splice(index, 1, copyCanvasTouch(e));
        }
    };

    function handleCanvasPointerUp(e) {
        //console.log(`pointerup: id = ${e.pointerId}`);
        isPointerDown = false;

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);
        
        if (index < 0) {
            //console.log(`can't figure out which touch to end`);
        } else {
            //console.log(`ending ongoing touch: index =  ${index}.`);

            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
            isPointerDown = false;
        }
    };

    function handleCanvasPointerLeave(e) {
        //console.log(`pointerleave: id = ${e.pointerId}`);
        isPointerDown = false;

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index < 0) {
            //console.log(`can't figure out which touch to end`);
        } else {
            //console.log(`ending ongoing touch: index =  ${index}.`);

            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    }

    function handleCanvasPointerCancel(e) {
        //console.log(`pointercancel: id = ${e.pointerId}`);
        isPointerDown = false;

        /* find the touchID that is being ended here */
        const index = findTouchIndexById(ongoingTouches, e.pointerId);

        if (index < 0) {
            //console.log(`can't figure out which touch to end`);
        } else {
            //console.log(`ending touch: index =  ${index}.`);

            /* remove it, we're done */
            ongoingTouches.splice(index, 1);
        }
    };

    function handleCanvasDragStart(e) {
        isPointerDown = false;
		e.preventDefault();
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
        <canvas id="canvas" class="matrix-canvas" width="{106 * pixelSize}" height="{17 * pixelSize}" style="touch-action: none;"
            on:pointerdown={handleCanvasPointerDown} on:pointermove={handleCanvasPointerMove} on:pointerup={handleCanvasPointerUp}
            on:pointerleave={handleCanvasPointerLeave} on:pointercancel={handleCanvasPointerCancel} on:dragstart={handleCanvasDragStart}>
                <b><i>Your browser does not support canvas element.</i></b>
        </canvas>
    {:else}
        <!--dummy overlay to enter true canvas mode on click-->
        <div on:click class="matrix-dummy-canvas" style="width: {106 * pixelSize}px; height: {17 * pixelSize}px; touch-action: auto;"></div>
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

    .matrix-column {
        flex-direction: column-reverse;
        display: inherit;
    }

	.matrix-pixel {
		box-shadow: 0px 0px 1px var(--matrix-pixel-box-shadow);
		background-color: var(--matrix-pixel-background-color);	
		float: left;		
	}

    .matrix-canvas {
        background: transparent;
        position: absolute;
        display: block;
        left: 0;
        top: 0;
    }

    .matrix-dummy-canvas {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIFVwbG9hZGVkIHRvIFNWR1JlcG8gaHR0cHM6Ly93d3cuc3ZncmVwby5jb20gLS0+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgdmlld0JveD0iMCAwIDMyIDMyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMiAzMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8cGF0aCBpZD0idG91Y2gtLWlkXzFfIiBkPSJNMTcuMzA0LDMxLjM2Yy0wLjE4NSwwLTAuMzQyLTAuMTQxLTAuMzU4LTAuMzI4Yy0wLjEwNy0xLjE5NC0wLjg3Ny0yLjQ3OS0yLjMxNS0yLjQ3OQoJYy0xLjMyLDAtMi4wODgsMC43NDMtMi44OTgsMS45NDNjLTAuMTEsMC4xNjYtMC4zMzQsMC4yMDgtMC41LDAuMDk4Yy0wLjE2NS0wLjExMS0wLjIwOC0wLjMzNi0wLjA5Ny0wLjUKCWMwLjc5My0xLjE3NSwxLjc2NS0yLjI2MiwzLjQ5NS0yLjI2MmMxLjg5LDAsMi44OTYsMS42MjYsMy4wMzIsMy4xMzZjMC4wMTgsMC4xOTgtMC4xMjgsMC4zNzMtMC4zMjYsMC4zOTEKCUMxNy4zMjUsMzEuMzU5LDE3LjMxNCwzMS4zNiwxNy4zMDQsMzEuMzZ6IE0yMS4yMjgsMzAuNDE2Yy0wLjA2NCwwLTAuMTI5LTAuMDE4LTAuMTg4LTAuMDU0Yy0xLjkyMS0xLjE3Ni0zLjExNC0zLjA2Ny0zLjExNC00LjkzNwoJYzAtMC42ODQsMC4xMzgtMS40MzgsMC4zNjctMi4wMTdjMC4wNzQtMC4xODUsMC4yODEtMC4yNzMsMC40NjgtMC4yMDJjMC4xODUsMC4wNzQsMC4yNzUsMC4yODMsMC4yMDIsMC40NjgKCWMtMC4yMzMsMC41ODgtMC4zMTYsMS4yOS0wLjMxNiwxLjc1MWMwLDEuNjIsMS4wNjIsMy4yNzYsMi43NzEsNC4zMjNjMC4xNjksMC4xMDQsMC4yMjMsMC4zMjUsMC4xMTgsMC40OTUKCUMyMS40NjcsMzAuMzU0LDIxLjM0OSwzMC40MTYsMjEuMjI4LDMwLjQxNnogTTguNTE1LDI5LjM2OWMtMC4xMTcsMC0wLjIzMS0wLjA1Ny0wLjMtMC4xNjFjLTAuMTEtMC4xNjYtMC4wNjUtMC4zOSwwLjEwMS0wLjQ5OQoJYzIuODI0LTEuODczLDUuMTA3LTMuNjg4LDcuNDA0LTUuODg0YzEuMjA3LTEuMTU1LDMuMjMtMy40NzEsMy4yMy02LjAwOWMwLTEuNTctMS4xMTUtMy4xOTMtMi45ODEtMy4xOTMKCWMtMS43MiwwLTMuMDE0LDEuOTQzLTQuMjY1LDMuODIzYy0wLjY1OSwwLjk4OS0xLjI4MSwxLjkyNC0xLjk3MSwyLjU5OGMtMS44ODgsMS44NDYtMy44NDQsMi45NDQtNi4wMjEsNC4wOQoJYy0wLjE3NywwLjA5My0wLjM5NCwwLjAyNC0wLjQ4Ni0wLjE1Yy0wLjA5My0wLjE3Ny0wLjAyNS0wLjM5NCwwLjE1MS0wLjQ4NmMyLjEyNi0xLjExOSw0LjAzNC0yLjE4OSw1Ljg1My0zLjk2OQoJYzAuNjM1LTAuNjIsMS4yMzctMS41MjQsMS44NzQtMi40ODFjMS4zNTYtMi4wMzcsMi43NTktNC4xNDMsNC44NjUtNC4xNDNjMi4zMTcsMCwzLjcwMiwxLjk5LDMuNzAyLDMuOTEzCgljMCwyLjgwNi0yLjE2NCw1LjI5NS0zLjQ1Myw2LjUyOWMtMi4zMjksMi4yMjgtNC42NDMsNC4wNjctNy41MDQsNS45NjRDOC42NTIsMjkuMzUsOC41ODMsMjkuMzY5LDguNTE1LDI5LjM2OXogTTI1LjE3MywyOC4yMgoJYy0wLjA0NCwwLTAuMDg5LTAuMDA5LTAuMTMyLTAuMDI1Yy0zLjI4My0xLjI5LTMuOTczLTMuOTQ2LTMuOTczLTUuOTQ2YzAtMC44NjYsMC4xNzEtMS42OCwwLjM1Mi0yLjU0MQoJYzAuMjEzLTEuMDIsMC40MzQtMi4wNzMsMC40MzQtMy40MTFjMC0yLjQwMy0yLjA0NS01LjczMS01Ljg4NS01LjczMWMtMy4yMzQsMC01LjE4OSwyLjQ4OS02LjA2NiwzLjk3MwoJYy0wLjg0MiwxLjQyNS0zLjE4OSw0Ljg4NC02Ljc3OCw2LjIxMWMtMC4xODgsMC4wNjYtMC4zOTQtMC4wMjYtMC40NjMtMC4yMTNzMC4wMjYtMC4zOTQsMC4yMTMtMC40NjMKCWMyLjM0LTAuODY1LDQuNzM1LTMuMDcxLDYuNDA4LTUuOTAyYzAuOTU2LTEuNjE2LDMuMDk0LTQuMzI2LDYuNjg2LTQuMzI2YzMuOTUxLDAsNi42MDUsMy4zMzUsNi42MDUsNi40NTEKCWMwLDEuNDEyLTAuMjM5LDIuNTUyLTAuNDUsMy41NThjLTAuMTcyLDAuODIzLTAuMzM1LDEuNjAyLTAuMzM1LDIuMzk0YzAsMS43NzYsMC42MDksNC4xMzQsMy41MTYsNS4yNzYKCWMwLjE4NSwwLjA3MiwwLjI3NiwwLjI4MSwwLjIwMywwLjQ2N0MyNS40NTIsMjguMTMzLDI1LjMxNiwyOC4yMiwyNS4xNzMsMjguMjJ6IE01LjgyMywyNy4zODZjLTAuMTIxLDAtMC4yMzktMC4wNjItMC4zMDctMC4xNzIKCWMtMC4xMDQtMC4xNjktMC4wNTEtMC4zOTEsMC4xMTgtMC40OTVjMy4yNy0yLjAxMyw3LjY2Ni01LjM0NywxMC4wMzctOS43OTljMC4wOTMtMC4xNzYsMC4zMS0wLjI0MywwLjQ4Ny0wLjE0OAoJYzAuMTc1LDAuMDk0LDAuMjQyLDAuMzEyLDAuMTQ4LDAuNDg3Yy0yLjQ0OCw0LjU5NS02Ljk1LDguMDE1LTEwLjI5NiwxMC4wNzRDNS45NTMsMjcuMzY4LDUuODg4LDI3LjM4Niw1LjgyMywyNy4zODZ6CgkgTTI3LjA2NSwyNS43ODZjLTAuMDQ4LDAtMC4wOTctMC4wMS0wLjE0NC0wLjAzYy0yLjIzOC0wLjk3NC0yLjY3Ny0yLjM2MS0yLjY3Ny00LjQzMWMwLTEuMjkxLDAuMTQ5LTEuOTM5LDAuMzA3LTIuNjI3CgljMC4xNjktMC43MzQsMC4zNDMtMS40OTMsMC4zNDMtMy4yMDFjMC0zLjgzMy0zLjQxMi03Ljk3LTguOTI2LTcuOTdjLTQuMTY1LDAtNi4xNzksMi4wNzgtNy44ODYsNC4yMDYKCWMtMC4xODgsMC4yMzQtMC4zOTMsMC41MDctMC42MTUsMC44MDNjLTEuMDYsMS40MTItMi41MTEsMy4zNDUtNC4zMzMsNC4wODNjLTAuMTg2LDAuMDc1LTAuMzk1LTAuMDE0LTAuNDY5LTAuMTk4CgljLTAuMDc1LTAuMTg1LDAuMDE0LTAuMzk0LDAuMTk4LTAuNDY5YzEuNjM3LTAuNjY0LDMuMDE5LTIuNTA0LDQuMDI4LTMuODQ4YzAuMjI4LTAuMzAzLDAuNDM3LTAuNTgzLDAuNjI5LTAuODIxCgljMS44MTYtMi4yNjUsMy45NjQtNC40NzYsOC40NDctNC40NzZjNS45NTgsMCw5LjY0Niw0LjUxMSw5LjY0Niw4LjY5YzAsMS43ODktMC4xOTIsMi42MjUtMC4zNjEsMy4zNjIKCWMtMC4xNDgsMC42NDYtMC4yODgsMS4yNTctMC4yODgsMi40NjZjMCwyLjExNSwwLjU0NSwzLjAzMiwyLjI0MywzLjc3MWMwLjE4MywwLjA3OSwwLjI2NiwwLjI5MSwwLjE4NywwLjQ3NAoJQzI3LjMzNywyNS43MDUsMjcuMjA0LDI1Ljc4NiwyNy4wNjUsMjUuNzg2eiBNMjcuNDc2LDIyLjc4M2MtMC4wNzQsMC0wLjE0OC0wLjAyMi0wLjIxMy0wLjA2OWMtMC4xNi0wLjExOC0wLjE5NS0wLjM0My0wLjA3OC0wLjUwNAoJYzAuODk3LTEuMjI4LDEuNDU1LTMuMzY2LDEuNDU1LTUuNTgyYzAtMS4yMDgtMC4wOTctMi41MzEtMC44MDEtNC4wMzJjLTAuMDg0LTAuMTgtMC4wMDctMC4zOTUsMC4xNzMtMC40NzkKCWMwLjE4LTAuMDgzLDAuMzk1LTAuMDA4LDAuNDc5LDAuMTczYzAuNzY2LDEuNjMzLDAuODY5LDMuMTA5LDAuODY5LDQuMzM4YzAsMi4zOTYtMC41OTYsNC42NDMtMS41OTQsNi4wMDgKCUMyNy42OTUsMjIuNzMxLDI3LjU4NiwyMi43ODMsMjcuNDc2LDIyLjc4M3ogTTMuNzMxLDExLjk5MWMtMC4wNjgsMC0wLjEzNy0wLjAxOS0wLjE5OC0wLjA1OWMtMC4xNjYtMC4xMDktMC4yMTItMC4zMzMtMC4xMDMtMC40OTkKCWMyLjE2NC0zLjI4NSw1LjgxOC03LjY1MiwxMi41MzgtNy42NTJjNC42NjIsMCw4Ljk3OSwyLjMyNywxMS41NDcsNi4yMjZjMC4xMDksMC4xNjcsMC4wNjMsMC4zOS0wLjEwMywwLjQ5OQoJYy0wLjE2NSwwLjEwOS0wLjM4OSwwLjA2NC0wLjQ5OS0wLjEwM2MtMi40MzQtMy42OTYtNi41MjUtNS45MDItMTAuOTQ1LTUuOTAyYy02LjM3MiwwLTkuODY0LDQuMTgzLTExLjkzNyw3LjMyOQoJQzMuOTYzLDExLjkzNSwzLjg0OCwxMS45OTEsMy43MzEsMTEuOTkxeiBNMjYuNzczLDUuOTI4Yy0wLjA5NCwwLTAuMTg3LTAuMDM2LTAuMjU3LTAuMTA4Yy0yLjc2My0yLjgyMi02LjU0OC00LjQ0Ny0xMC4zODUtNC40NgoJYy0wLjAxOSwwLTAuMDM4LDAtMC4wNTcsMGMtNC4wODgsMC03LjczOCwxLjUyNC0xMC41NTgsNC40MUM1LjM3OCw1LjkxMiw1LjE0OSw1LjkxNCw1LjAwOCw1Ljc3NgoJQzQuODY1LDUuNjM3LDQuODYzLDUuNDA5LDUuMDAyLDUuMjY3QzcuOTYsMi4yMzksMTEuNzg5LDAuNjQsMTYuMDc0LDAuNjRjMC4wMiwwLDAuMDQsMCwwLjA2LDAKCWM0LjAyOCwwLjAxNCw4LjAwMSwxLjcxOCwxMC44OTYsNC42NzZjMC4xNCwwLjE0MiwwLjEzNywwLjM3LTAuMDA1LDAuNTA5QzI2Ljk1NSw1Ljg5NCwyNi44NjQsNS45MjgsMjYuNzczLDUuOTI4eiIvPgo8cmVjdCBpZD0iX1RyYW5zcGFyZW50X1JlY3RhbmdsZSIgc3R5bGU9ImZpbGw6bm9uZTsiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIvPgo8L3N2Zz4K);
        background-repeat: no-repeat;
        background-position: center;
        background-size: 5%;
        transition: 0.125s;
        position: absolute;
        touch-action: auto;
        display: block;
        opacity: 0.1;
        left: 0;
        top: 0;
    }

    .matrix-dummy-canvas:hover {
        background-color: #00b3ff88;
        opacity: 1;
    }

    .matrix-dummy-canvas:focus {
        background-color: #00b3ff88;
        opacity: 1;
    }

    .matrix-dummy-canvas:active {
        background-color: #00b3ff88;
        opacity: 1;
    }
</style>