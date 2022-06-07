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