<div class="matrix">
	{#each Array(106) as _, index (index)}
		<div class="matrix-column">
			{#each Array(17) as _, index (index)}
				<div class="matrix-pixel"></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.matrix {
		box-shadow: 0px 0px 2px #444444;
		display: inherit;
		height: inherit;
		width: inherit;
	}

	.matrix-column {
		height: inherit;
		width: 10px;
	}

	.matrix-pixel {
		/*box-shadow: 0px 0px 1px #ffffff;
		background-color: #999999;*/
		box-shadow: 0px 0px 1px #231816;
		background-color: #ffffff;
		height: 10px;
		width: 10px;	
		float: left;		
	}

	.matrix-pixel:hover {
		box-shadow: 0px 0px 1px #ff0000;
		background: #ffa500;
	}
</style>