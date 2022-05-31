<script>
	import Graph from './demo/CanvasContainer.svelte'
</script>

<div class="demo-container">
	<div class="graph"><Graph></Graph></div>
    
</div>

<style>
	.demo-container {
		height: 600px;
		width: 1300px;
	}

	.graph {
		transform: translateY(-50%) translateX(-50%);
		position: absolute;
		left: 50%;
		top: 50%;
	}
</style>