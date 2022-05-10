<script>
	export let name;
</script>

<main>
	<div class="container">
		<div class="canvas">
			{#each Array(1700) as _, index (index)}
				<div class="pixel"></div>
			{/each}
		</div> 
	</div>
</main>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f4f4f4;
		width: 1020px;
		height: 190px;
	}

	.canvas {
		width: 1000px;
		height: 170px;
	}

	.pixel {
		width: 10px;
		height: 10px;
		float: left;
		box-shadow: 0px 0px 1px #fff;
		background-color: black;
	}
	
	.pixel:nth-child(101) {
		background: orange;
	}
</style>