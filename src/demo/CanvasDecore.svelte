<script>
    import CanvasMatrix from './CanvasMatrix.svelte'
    export let pixelSize;
</script>

<!--constants in braces represent the amount of pixels, as defined by the canvas matrix-->
<div class="decore" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px">
    <div class="decore-outer-top" style="width: {116 * pixelSize}px; height: {3 * pixelSize}px">
        {#each Array(116) as _, index (index)}
            <div class="decore-outer-column" style="width: {pixelSize}px; height: {3 * pixelSize}px">
                {#each Array(3) as _, index (index)}
                    <div class="decore-outer-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="decore-outer-left" style="width: {3 * pixelSize}px; height: {21 * pixelSize}px">
        {#each Array(3) as _, index (index)}
            <div class="decore-outer-column" style="width: {pixelSize}px; height: {21 * pixelSize}px">
                {#each Array(21) as _, index (index)}
                    <div class="decore-outer-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="decore-inner" style="width: {110 * pixelSize}px; height: {21 * pixelSize}px">
        <div class="decore-inner-top" style="width: {110 * pixelSize}px; height: {2 * pixelSize}px">
            {#each Array(110) as _, index (index)}
                <div class="decore-inner-column" style="width: {pixelSize}px; height: {2 * pixelSize}px">
                    {#each Array(2) as _, index (index)}
                        <div class="decore-inner-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                    {/each}
                </div>
            {/each}
        </div>

        <div class="decore-inner-left" style="width: {2 * pixelSize}px; height: {17 * pixelSize}px">
            {#each Array(2) as _, index (index)}
                <div class="decore-inner-column" style="width: {pixelSize}px; height: {17 * pixelSize}px">
                    {#each Array(17) as _, index (index)}
                        <div class="decore-inner-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                    {/each}
                </div>
            {/each}
        </div>

        <div class="matrix-container" style="width: {106 * pixelSize}px; height: {17 * pixelSize}px">
            <CanvasMatrix {pixelSize}></CanvasMatrix>
        </div>

        <div class="decore-inner-right" style="width: {2 * pixelSize}px; height: {17 * pixelSize}px">
            {#each Array(2) as _, index (index)}
                <div class="decore-inner-column" style="width: {pixelSize}px; height: {17 * pixelSize}px">
                    {#each Array(17) as _, index (index)}
                        <div class="decore-inner-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                    {/each}
                </div>
            {/each}
        </div>

        <div class="decore-inner-bot" style="width: {110 * pixelSize}px; height: {2 * pixelSize}px">
            {#each Array(110) as _, index (index)}
                <div class="decore-inner-column" style="width: {pixelSize}px; height: {2 * pixelSize}px">
                    {#each Array(2) as _, index (index)}
                        <div class="decore-inner-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                    {/each}
                </div>
            {/each}
        </div>
    </div>

    <div class="decore-outer-right" style="width: {3 * pixelSize}px; height: {21 * pixelSize}px">
        {#each Array(3) as _, index (index)}
            <div class="decore-outer-column" style="width: {pixelSize}px; height: {21 * pixelSize}px">
                {#each Array(21) as _, index (index)}
                    <div class="decore-outer-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="decore-outer-bot" style="width: {116 * pixelSize}px; height: {3 * pixelSize}px">
        {#each Array(116) as _, index (index)}
            <div class="decore-outer-column" style="width: {pixelSize}px; height: {3 * pixelSize}px">
                {#each Array(3) as _, index (index)}
                    <div class="decore-outer-pixel" style="width: {pixelSize}px; height: {pixelSize}px"></div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .decore {
		box-shadow: 0px 0px 1px #cccccc;
		flex-flow: row wrap;
		position: inherit;
		display: inherit;
	}

    .decore > * {
        flex-flow: nowrap;
        display: inherit;
    }

    .decore-inner {
        box-shadow: 0px 0px 1px #bbbbbb;
        flex-flow: row wrap;
        position: relative;
        display: inherit;
		z-index: 2;
	}

    .decore-inner > * {
        flex-flow: nowrap;
        display: inherit;
    }

	.matrix-container {
		position: relative;
		display: inherit;
		z-index: 2;
	}

    .decore-outer-pixel {
		box-shadow: 0px 0px 1px #ffffff;
		background-color: #aaaaaa;
        float: left;
	}

    .decore-inner-pixel {
		box-shadow: 0px 0px 1px #ffffff;
		background-color: #a7a7a7;
		float: left;
	}
</style>