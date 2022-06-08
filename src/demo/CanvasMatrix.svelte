<script>
	import { kValueStringBin, graphPaddingLeft, graphPaddingTop } from './Stores.js';
	export let pixelSize;

	/* create 2D array and populate it with '0's */
	let kValueArray = new Array(106);
	for (let i = 0; i < kValueArray.length; i++) {
		kValueArray[i] = new Array(17);
		for (let j = 0; j < kValueArray[i].length; j++) {
			kValueArray[i][j] = '0';
		}
	}
	
	const ongoingTouches = [];
	let isMouseDown = false;
	let isTouchDown = false;
	let kValueString = '';
	let pixelOffsetX = 0;
	let pixelOffsetY = 0;
	let arrayCol = 0;
	let arrayPix = 0;
	let pixelID = '';

	/* calculate values to offset pageX/Y for pixels */
	graphPaddingLeft.subscribe(value => {
		if (window.matchMedia("(orientation: portrait)").matches) {
			pixelOffsetX = value + (pixelSize * 23); /* 23 = pad:1 + grad:5 + pixs:16(+1) */
		} else if (window.matchMedia("(orientation: landscape)").matches) {
			pixelOffsetX = value + (pixelSize * 5); /* 5 = grad:5 */
		}
    });

	graphPaddingTop.subscribe(value => {
		if (window.matchMedia("(orientation: portrait)").matches) {
			pixelOffsetY = (value + (pixelSize * 5)) * -1; /* 5 = grad:5, -1 = val:neg */
		} else if (window.matchMedia("(orientation: landscape)").matches) {
			pixelOffsetY = value + (pixelSize * 23); /* 23 = pad:1 + grad:5 + pixs:16(+1) */
		}
    });

	/* functions that actually do the stuff */
	function kValueArrayToString() {
		kValueString = '';
		for (let i = 0; i < kValueArray.length; i++) {
			for (let j = 0; j < kValueArray[i].length; j++) {
				kValueString += kValueArray[i][j];
			}
		}

		/* export the final binary string for others to access */
		kValueStringBin.update(n => kValueString);
	}

	function touchPaint(pageX, pageY) {
		if (window.matchMedia("(orientation: portrait)").matches) {
			arrayPix = Math.floor((pixelOffsetX - pageX) / pixelSize);
			arrayCol = Math.floor((pixelOffsetY - pageY) / pixelSize);
		} else if (window.matchMedia("(orientation: landscape)").matches) {
			arrayCol = Math.floor((pageX - pixelOffsetX) / pixelSize);
			arrayPix = Math.floor((pixelOffsetY - pageY) / pixelSize);
		}
		
		//console.log('pageX:' + pageX +  ' pageY: ' + pageY);
		//console.log('arrayCol: ' + arrayCol + ' arrayPix: ' + arrayPix);
		
		if (arrayCol > 105 || arrayPix > 16 || arrayPix < 0 || arrayCol < 0) {
			/* add some effect for when out of bounds */
			isTouchDown = false;
			isMouseDown = false;
			return;
		} else {
			/* maybe improve this? visually? */
			pixelID = 'pixel-' + arrayCol + '-' + arrayPix;
		}

		document.getElementById(pixelID).style.backgroundColor = "#ff0000";
		kValueArray[arrayCol][arrayPix] = '1';
	}


	/* canvas TOUCH events: start, move, cancel, end */
	function handleCanvasTouchStart(e) {
		e.preventDefault();
		isTouchDown = true;
		
		const touches = e.changedTouches;
		for (let i = 0; i < touches.length; i++) {
			touchPaint(touches[i].pageX, touches[i].pageY);
		}
	}

	function handleCanvasTouchMove(e) {
		e.preventDefault();
		
		if (isTouchDown === true) {
			const touches = e.changedTouches;
			for (let i = 0; i < touches.length; i++) {
				touchPaint(touches[i].pageX, touches[i].pageY);
			}
		}
	}

	function handleCanvasTouchCancel(e) {
		e.preventDefault();
		isTouchDown = false;
	}

	function handleCanvasTouchEnd(e) {
		e.preventDefault();
		isTouchDown = false;
		kValueArrayToString();
	}

	/* canvas MOUSE events: down, move, leave, up */
	function handleCanvasMouseDown(e) {
		e.preventDefault();
		isMouseDown = true;

		touchPaint(e.pageX, e.pageY);
	}

	function handleCanvasMouseMove(e) {
		e.preventDefault();

		if (isMouseDown === true) {
			touchPaint(e.pageX, e.pageY);
		}	
	}

	function handleCanvasMouseLeave(e) {
		e.preventDefault();
		isMouseDown = false;
	}

	function handleCanvasMouseUp(e) {
		e.preventDefault();
		isMouseDown = false;
		kValueArrayToString();
	}
	
	/* absolutely no dragging!!! */
	function handleCanvasDragStart(e) {
		e.preventDefault();
		isMouseDown = false;
		isTouchDown = false;
	}
</script>

<!--constants in braces represent the amount of pixels, as defined here-->
<div 
	on:dragstart={handleCanvasDragStart}
	on:touchstart={handleCanvasTouchStart} on:touchmove={handleCanvasTouchMove} on:touchcancel={handleCanvasTouchCancel} on:touchend={handleCanvasTouchEnd}
	on:mousedown={handleCanvasMouseDown} on:mousemove={handleCanvasMouseMove} on:mouseleave={handleCanvasMouseLeave} on:mouseup={handleCanvasMouseUp}
	id="matrix" class="matrix" style="width: {106 * pixelSize}px; height: {17 * pixelSize}px">
	{#each Array(106) as _, indexCol (indexCol)}
		<div class="matrix-column" style="width: {pixelSize}px; height: {17 * pixelSize}px">
			{#each Array(17) as _, indexPix (indexPix)}
				<div id="pixel-{indexCol}-{16 - indexPix}" class="matrix-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.matrix {
		box-shadow: 0px 0px 2px var(--matrix-box-shadow);
		display: inherit;
	}

	.matrix-pixel {
		box-shadow: 0px 0px 1px var(--matrix-pixel-box-shadow);
		background-color: var(--matrix-pixel-background-color);	
		float: left;		
	}

	.matrix-pixel:hover {
		box-shadow: 0px 0px 1px var(--matrix-pixel-background-color-hover);
		background: var(--matrix-pixel-background-color-hover);
	}
</style>