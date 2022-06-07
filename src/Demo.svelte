<script>
	import Graph from './demo/CanvasBlanket.svelte'
</script>

<div class="graph-container">
	<Graph></Graph>    
</div>

<style>
	@media only screen and (orientation: portrait) {
        .graph-container {
			position:relative; 
			margin-right: auto;
			margin-left: auto;
			display: block;
		}
    }

	@media only screen and (orientation: landscape) {
        .graph-container {
			position:relative;
			margin-right: auto;
			margin-left: auto;
			display: block;
		}
    }
</style>