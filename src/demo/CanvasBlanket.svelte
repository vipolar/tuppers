<script>
    import CanvasContainer from './CanvasContainer.svelte'
    import { onMount } from 'svelte';

    let pixelSize = 0;
    let tempPWidth = 0;
    let tempPHeight = 0;
    let windowWidth = 0;
    let windowHeight = 0;
    let windowDegree = 0;
	
	const debounce = (func, delay) => {
		let timer;

		return function () {
			const context = this;
			const args = arguments;
			clearTimeout(timer);
			timer = setTimeout(() => func.apply(context, args), delay);
		};
	};

	const setPixelSize = () => {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        if (windowWidth > windowHeight) {
            windowDegree = 0;
            tempPHeight = Math.floor(windowHeight / 27);
            tempPWidth =  Math.floor(windowWidth / 116);
        } else if (windowWidth < windowHeight) {
            windowDegree = -90;
            tempPHeight = Math.floor(windowHeight / 116);
            tempPWidth =  Math.floor(windowWidth / 27);
        } else {
            windowDegree = 0;
            tempPHeight = Math.floor(windowHeight / 27);
            tempPWidth =  Math.floor(windowWidth / 116);
        }

        /* check for the boundaries and the balance of Height vs Width */
        pixelSize = tempPWidth > tempPHeight ? tempPHeight : tempPWidth;
        pixelSize = pixelSize <= 10 ? pixelSize : 10;
        pixelSize = pixelSize >= 2 ? pixelSize : 2;
	};
	
	const debouncedsetPixelSize = debounce(setPixelSize, 300);
	
	onMount(() => {		
		window.addEventListener('resize', debouncedsetPixelSize);
		
		return () => {
			window.removeEventListener('resize', debouncedsetPixelSize);
		}
	});

    /* run once on page load */
    setPixelSize();
</script>

<!--constants in braces represent the amount of pixels, as defined by the canvas matrix-->
<div class="container-container" style="transform: rotate({windowDegree}deg)"> <!--width: {116 * pixelSize}px; height: {27 * pixelSize}px;-->
    <CanvasContainer {pixelSize}></CanvasContainer>
    <h1>{windowWidth} {windowHeight} {tempPWidth} {tempPHeight} {pixelSize}</h1>
</div>



<div class="loader">
    <h2>LOADING</h2>
    <div class="mosaic-loader">
        <div class="cell d-0"></div>
        <div class="cell d-1"></div>
        <div class="cell d-2"></div>
        <div class="cell d-3"></div>
        <div class="cell d-1"></div>
        <div class="cell d-2"></div>
        <div class="cell d-3"></div>
        <div class="cell d-4"></div>
        <div class="cell d-2"></div>
        <div class="cell d-3"></div>
        <div class="cell d-4"></div>
        <div class="cell d-5"></div>
        <div class="cell d-3"></div>
        <div class="cell d-4"></div>
        <div class="cell d-5"></div>
        <div class="cell d-6"></div>
    </div>
</div>

<style>
    .container-container {
        justify-content: center;
        align-items: center;
        flex-flow: row wrap;
        position: absolute;
        display: flex;
        height: 100%;
        width: 100%;
    }

    h1 {
        display: block;
        font-weight: 500;
        font-size: 1em;
        color: orangered;
        position: absolute;
        z-index: 99;
        right: 0;
        top: 0;
    }

    h2 {
        display: block;
        color: white;
        font-weight: 100;
        text-align: center;
    }

    .loader {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        font-family: "Lato";
        font-weight: 300;
        font-size: 24px;
        background: #2b2b2b;
    }

    .mosaic-loader {
        --cell-size: 64px;
        --cell-spacing: 1px;
        --border-width: 1px;
        --cells: 4;
        --total-size: calc(var(--cells) * (var(--cell-size) + 2 * var(--cell-spacing)));
        display: flex;
        flex-wrap: wrap;
        width: var(--total-size);
        height: var(--total-size);
    }

    .mosaic-loader > .cell {
        --cell-color: white;
        flex: 0 0 var(--cell-size);
        margin: var(--cell-spacing);
        background-color: transparent;
        box-sizing: border-box;
        border: var(--border-width) solid var(--cell-color);
        animation: 1.5s ripple ease infinite;
    }

    .mosaic-loader > .cell.d-1 {
        animation-delay: 100ms;
    }

    .mosaic-loader > .cell.d-2 {
        animation-delay: 200ms;
    }

    .mosaic-loader > .cell.d-3 {
        animation-delay: 300ms;
    }

    .mosaic-loader > .cell.d-4 {
        animation-delay: 400ms;
    }

    .mosaic-loader > .cell.d-5 {
        animation-delay: 500ms;
    }

    .mosaic-loader > .cell.d-6 {
        animation-delay: 600ms;
    }

    .mosaic-loader > .cell:nth-child(1) {
        --cell-color: #d4aee0;
    }

    .mosaic-loader > .cell:nth-child(2) {
        --cell-color: #8975b4;
    }

    .mosaic-loader > .cell:nth-child(3) {
        --cell-color: #64518a;
    }

    .mosaic-loader > .cell:nth-child(4) {
        --cell-color: #565190;
    }

    .mosaic-loader > .cell:nth-child(5) {
        --cell-color: #44abac;
    }

    .mosaic-loader > .cell:nth-child(6) {
        --cell-color: #2ca7d8;
    }

    .mosaic-loader > .cell:nth-child(7) {
        --cell-color: #1482ce;
    }

    .mosaic-loader > .cell:nth-child(8) {
        --cell-color: #05597c;
    }

    .mosaic-loader > .cell:nth-child(9) {
        --cell-color: #b2dd57;
    }

    .mosaic-loader > .cell:nth-child(10) {
        --cell-color: #57c443;
    }

    .mosaic-loader > .cell:nth-child(11) {
        --cell-color: #05b853;
    }

    .mosaic-loader > .cell:nth-child(12) {
        --cell-color: #19962e;
    }

    .mosaic-loader > .cell:nth-child(13) {
        --cell-color: #fdc82e;
    }

    .mosaic-loader > .cell:nth-child(14) {
        --cell-color: #fd9c2e;
    }

    .mosaic-loader > .cell:nth-child(15) {
        --cell-color: #d5385a;
    }

    .mosaic-loader > .cell:nth-child(16) {
        --cell-color: #911750;
    }

    @keyframes ripple {
        0% {
            background-color: transparent;
        }
  
        30% {
            background-color: var(--cell-color);
        }
  
        60% {
            background-color: transparent;
        }
  
        100% {
            background-color: transparent;
        }
    }
</style>