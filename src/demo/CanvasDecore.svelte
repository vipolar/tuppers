<script>
    import Matrix from './CanvasMatrix.svelte'
</script>

<div class="decore">
    <div class="decore-top">
        {#each Array(110) as _, index (index)}
            <div class="decore-column">
                {#each Array(2) as _, index (index)}
                    <div class="decore-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="decore-left">
        {#each Array(2) as _, index (index)}
            <div class="decore-column">
                {#each Array(17) as _, index (index)}
                    <div class="decore-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="matrix-container">
        <Matrix></Matrix>
    </div>

	<div class="decore-right">
        {#each Array(2) as _, index (index)}
            <div class="decore-column">
                {#each Array(17) as _, index (index)}
                    <div class="decore-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="decore-bot">
        {#each Array(110) as _, index (index)}
            <div class="decore-column">
                {#each Array(2) as _, index (index)}
                    <div class="decore-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .decore {
		contain: content;
		box-shadow: 0px 0px 2px #444444;
		flex-flow: row wrap;
		position: inherit;
		display: inherit;
		height: inherit;
		width: inherit;
	}

    .decore-top {
		position: inherit;
		width: 1100px;
		height: 20px;
	}

	.decore-left {
		position: inherit;
		height: 170px;
		width: 20px;
	}

	.matrix-container {
		position: relative;
		display: inherit;
		width: 1060px;
		height: 170px;
		z-index: 2;
	}

	.decore-right {
		height: 170px;
		width: 20px;
	}

	.decore-bot {
		position: inherit;
		width: 1100px;
		height: 20px;
	}

    .decore-pixel {
		box-shadow: 0px 0px 1px #231816;
		background-color: #ffffff;
		height: 10px;
		width: 10px;
		float: left;
	}
</style>