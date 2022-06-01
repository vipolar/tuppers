<script>
	export let pixelSize;
</script>

<!--constants in braces represent the amount of pixels, as defined here-->
<div class="matrix" style="width: {106 * pixelSize}px; height: {17 * pixelSize}px">
	{#each Array(106) as _, index (index)}
		<div class="matrix-column" style="width: {pixelSize}px; height: {17 * pixelSize}px">
			{#each Array(17) as _, index (index)}
				<div class="matrix-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.matrix {
		box-shadow: 0px 0px 2px #990000;
		display: inherit;
	}

	.matrix-pixel {
		box-shadow: 0px 0px 1px #ffffff;
		background-color: #999999;	
		float: left;		
	}

	.matrix-pixel:hover {
		box-shadow: 0px 0px 1px #ff0000;
		background: #ffa500;
	}
</style>