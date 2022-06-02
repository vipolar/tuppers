<script>
    import CanvasDecore from './CanvasDecore.svelte'
    export let pixelSize;
</script>

<!--constants in braces represent the amount of pixels, as defined by the canvas matrix-->
<div class="container" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px">
    <div class="container-top-gradient" style="width: {116 * pixelSize}px; height: {5 * pixelSize}px"></div>
    <div class="container-left-gradient" style="width: {5 * pixelSize}px; height: {27 * pixelSize}px"></div>
    <div class="container-right-gradient" style="width: {5 * pixelSize}px; height: {27 * pixelSize}px"></div>
    <div class="container-bot-gradient" style="width: {116 * pixelSize}px; height: {5 * pixelSize}px"></div>

    <div class="decore-container" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px">
        <CanvasDecore {pixelSize}></CanvasDecore>
    </div>

    <!--font-size adjustments might be harmful, need testing on mobile devices-->
    <div class="container-axis-y" style="width: {5 * pixelSize}px; height: {27 * pixelSize}px">
        <div class="container-axis-y-arrow-body"></div>
		<div class="container-axis-y-arrow-head" style="width: {pixelSize}px; height: {pixelSize}px; top: {pixelSize / 5}px"></div>
        <div class="container-axis-y-arrow-rest" style="width: {5 * pixelSize}px; height: {22 * pixelSize}px">
            <div class="container-axis-y-arrow-rest-name" style="font-size: {pixelSize / 10}em; right: {pixelSize * -1.5}px; top: {pixelSize}px"><b>Y</b></div> 
            <div class="container-axis-y-arrow-rest-dash" style="width: {5 * pixelSize}px; height: {17 * pixelSize}px">
                <div class="container-axis-y-arrow-rest-dash-first" style="font-size: {pixelSize / 10}em; right: {pixelSize / 2}px; bottom: {pixelSize / 5}px"><b><i>k</i></b></div>
                <div class="container-axis-y-arrow-rest-dash-last" style="font-size: {pixelSize / 10}em; right: {pixelSize / 2}px; top: {pixelSize * -1}px"><b><i>k+17</i></b></div>
            </div>
        </div>
    </div>

    <!--font-size adjustments might be harmful, need testing on mobile devices-->
    <div class="container-axis-x" style="width: {116 * pixelSize}px; height: {5 * pixelSize}px">
        <div class="container-axis-x-arrow-body"></div> 
        <div class="container-axis-x-arrow-head" style="width: {pixelSize}px; height: {pixelSize}px; right: {pixelSize / 5}px"></div>
        <div class="container-axis-x-arrow-rest" style="width: {111 * pixelSize}px; height: {5 * pixelSize}px">
            <div class="container-axis-x-arrow-rest-name" style="font-size: {pixelSize / 10}em; right: {pixelSize * 1.3}px; top: {pixelSize * -2}px"><b>X</b></div> 
            <div class="container-axis-x-arrow-rest-dash" style="width: {106 * pixelSize}px; height: {5 * pixelSize}px">
                <div class="container-axis-x-arrow-rest-dash-first" style="font-size: {pixelSize / 10}em; left: {pixelSize / 5}px"><b><i>0</i></b></div>
                <div class="container-axis-x-arrow-rest-dash-last" style="font-size: {pixelSize / 10}em; right: {pixelSize * -1}px"><b><i>106</i></b></div>
            </div>
        </div>
    </div>
</div>

<style>
    .container {
		flex-flow: row wrap;
		position: absolute;
		contain: content;
		display: flex;        
	}

    .container-top-gradient {
		background-image: linear-gradient(to top, #ff000000, #ffffff);
		position: inherit;
        z-index: 3;   
        top: 0;
	}

    .container-left-gradient {
		background-image: linear-gradient(to left, #ff000000, #ffffff);
		position: inherit;
        z-index: 3; 
        left: 0;
	}

    .decore-container {
        flex-flow: inherit;
		display: flex;
    }

	.container-right-gradient {
		background-image: linear-gradient(to right, #ff000000, #ffffff);
		position: inherit;
        z-index: 3;
        right: 0;
	}

	.container-bot-gradient {
		background-image: linear-gradient(to bottom, #ff000000, #ffffff);
		position: inherit;
        z-index: 3;   
        bottom: 0;
	}

    .container-axis-y {
		position: inherit;
        z-index: 4;
        left: 0;
        top: 0;
    }

    .container-axis-y-arrow-body {
        border-left: 2px solid #000000;
		position: inherit;
        height: inherit;
		right: -1px;
    }

    .container-axis-y-arrow-head {
        left: 100%;
        float: right;
        position: inherit;
        border-top: 2px solid #000000;
        border-right: 2px solid #000000;
        transform: translateX(-50%) rotate(-45deg);
        /* Hacky as fuck but it somehow works, so fuck off! */
    }

    .container-axis-y-arrow-rest {
        position: inherit;
        z-index: 5;
        left: 0;
        top: 0;
    }

    .container-axis-y-arrow-rest-name {
        position: inherit;
        color: #000000;
    }

    .container-axis-y-arrow-rest-dash {
        position: inherit;
        text-align: right;
        z-index: 5;
        bottom: 0;
        left: 0;
    }

    .container-axis-y-arrow-rest-dash-first {
        position: inherit;
        color: #000000;
        bottom: 0;
    }

    .container-axis-y-arrow-rest-dash-last {
        position: inherit;
        color: #000000;
    }

    .container-axis-x {
		position: inherit;
        z-index: 4;
        bottom: 0;
    }

    .container-axis-x-arrow-body {
        border-bottom: 2px solid #000000;
		position: inherit;
        width: inherit;
        top: -1px;
    }

    .container-axis-x-arrow-head {
        float: right;
        position: inherit;
        border-top: 2px solid #000000;
        border-right: 2px solid #000000;
        transform: translateY(-50%) rotate(45deg);
        /* Hacky as fuck but it somehow works, so fuck off! */
    } 

    .container-axis-x-arrow-rest {
        position: inherit;
        z-index: 5;
        right: 0;
        top: 0;
    }

    .container-axis-x-arrow-rest-name {
        position: inherit;
        color: #000000;
    }

    .container-axis-x-arrow-rest-dash {
        position: inherit;
        text-align: left;
        z-index: 5;
        bottom: 0;
        left: 0;
    }

    .container-axis-x-arrow-rest-dash-first {
        position: inherit;
        color: #000000;
        top: 0;
    }

    .container-axis-x-arrow-rest-dash-last {
        position: inherit;
        color: #000000;
        top: 0;
    }    
</style>
