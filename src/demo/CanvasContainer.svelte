<script>
    import Decore from './CanvasDecore.svelte'
</script>

<div class="container">
    <div class="container-top-gradient"></div>
    <div class="container-top">
        {#each Array(116) as _, index (index)}
            <div class="container-column">
                {#each Array(3) as _, index (index)}
                    <div class="container-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="container-left-gradient"></div>
    <div class="container-left">
        {#each Array(3) as _, index (index)}
            <div class="container-column">
                {#each Array(21) as _, index (index)}
                    <div class="container-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="decore-container">
        <Decore></Decore>
    </div>

    <div class="container-right-gradient"></div>
    <div class="container-right">
        {#each Array(3) as _, index (index)}
            <div class="container-column">
                {#each Array(21) as _, index (index)}
                    <div class="container-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="container-bot-gradient"></div>
    <div class="container-bot">
        {#each Array(116) as _, index (index)}
            <div class="container-column">
                {#each Array(3) as _, index (index)}
                    <div class="container-pixel"></div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="container-axis-y">
        <div class="container-arrow-body"></div>
		<div class="container-arrow-head"></div>
        <div class="container-arrow-name">
            <b>y-axis</b>
        </div>
    </div>

    <div class="container-axis-x">
        <div class="container-arrow-body"></div>
        <div class="container-arrow-head"></div>
        <div class="container-arrow-name">
            <b>x-axis</b>
        </div>
    </div>
</div>

<style>
    .container {
		transform: translateY(-50%) translateX(-50%);
		flex-flow: row wrap;
		position: absolute;
		contain: content;
		display: flex;
		width: 1160px;
		height: 270px;
		left: 50%;
		top: 50%;
	}

    .container-top {
		width: 1160px;
		height: 30px;
	}

    .container-top-gradient {
		background-image: linear-gradient(to top, #ff000000, #790000);
		position: absolute;
		width: 1160px;
		height: 50px;
        z-index: 3;   
        top: 0;
	}

	.container-left {
        height: 210px;
		width: 30px;
	}

    .container-left-gradient {
		background-image: linear-gradient(to left, #ff000000, #790000);
		position: absolute;
		height: 270px;
		width: 50px;
        z-index: 3; 
        left: 0;
	}

	.decore-container {
        position: relative;
        display: flex;
        width: 1100px;
        height: 210px;
		z-index: 2;
	}

	.container-right {
        height: 210px;
		width: 30px;
	}

	.container-right-gradient {
		background-image: linear-gradient(to right, #ff000000, #790000);
		position: absolute;
		height: 270px;
		width: 50px;
        z-index: 3;
        right: 0;
	}

	.container-bot {
		width: 1160px;
		height: 30px;
	}

	.container-bot-gradient {
		background-image: linear-gradient(to bottom, #ff000000, #790000);
		position: absolute;
		width: 1160px;
		height: 50px;
        z-index: 3;   
        bottom: 0;
	}

    .container-pixel {
        float: left;
		width: 10px;
		height: 10px;
		box-shadow: 0px 0px 1px #999999;
	}

    .container-axis-y {
		position: absolute;
        height: inherit;
        width: 10px;
		left: 40px;
        z-index: 4;
    }

    .container-axis-y .container-arrow-body {
        border-left: 2px solid #000000;
		position: absolute;
        height: inherit;
		left: 9px;
    }

    .container-axis-y .container-arrow-head {
        top: 2px;
        left: 100%;
        width: 10px;
        height: 10px;
        float: right;
        position: absolute;
        border-top: 2px solid #000000;
        border-right: 2px solid #000000;
        transform: translateX(-50%) rotate(-45deg);
        /* Hacky as fuck but it somehow works, so fuck off! */
    }

    .container-axis-y .container-arrow-name {
        position: absolute;
        color: #000000;
        content: "Y";
        top: 15px;
    }

    .container-axis-x {
		position: absolute;
        width: inherit;
        height: 10px;
		bottom: 40px;
        z-index: 4;
    }

    .container-axis-x .container-arrow-body {
        border-bottom: 2px solid #000000;
		position: absolute;
        width: inherit;
        bottom: 9px;
    }

    .container-axis-x .container-arrow-head {
        right: 2px;
        width: 10px;
        height: 10px;
        float: right;
        position: absolute;
        border-top: 2px solid #000000;
        border-right: 2px solid #000000;
        transform: translateY(-50%) rotate(45deg);
        /* Hacky as fuck but it somehow works, so fuck off! */
    } 

    .container-axis-x .container-arrow-name {
        position: absolute;
        color: #000000;
        right: 15px;
    }

</style>
