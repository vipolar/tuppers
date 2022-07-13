<script>
	import Demo from './demo/CanvasBaseControl.svelte'
</script>

<Demo></Demo>

<input type="color" bind:value={canvasPixelBackground} style="height: 50px; z-index: 99; position: absolute">