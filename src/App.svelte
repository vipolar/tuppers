<script>
	//import Display from './Display.svelte'
	import Canvas from './Canvas.svelte'

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
</script>

<!--
<body style="height: 2000px; width: 2000px;">
<Demo {pixelSize}></Demo>
</body>
-->
<div class="canvas" style="width: {116 * pixelSize}px; height: {34 * pixelSize}px; --portraitOffset: {116 * pixelSize}px">
	<Canvas {pixelSize}></Canvas>
</div>

<style>
	.canvas {
        transform-style: preserve-3D;
        transform-origin: left top;
        position: absolute;
        margin-right: auto;
        margin-left: auto;
        right: 0;
        left: 0;
    }

	@media (orientation: landscape) {
        .canvas {
            align-self: center;
        }
    }

    @media (orientation: portrait) {
        .canvas {
            transform: rotate(-90deg);
            top: var(--portraitOffset);
        }
    }
</style>