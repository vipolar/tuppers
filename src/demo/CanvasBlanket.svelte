<script>
    import CanvasButtons from './CanvasButtons.svelte';
    import { onMount } from 'svelte';

    let pixelSize = 0;
    let tempPWidth = 0;
    let tempPHeight = 0;
    let windowWidth = 0;
    let windowHeight = 0;
    let windowRotateDeg = 0;
    let windowTranslateX = 0;
    let windowTranslateY = 0;
    let loaderDisplay = false;

	const setPixelSize = () => {
        /* display loader */
        loaderDisplay = true;

        /* get client screen size */
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        const balancePixelSize = () => {
            pixelSize = tempPWidth > tempPHeight ? tempPHeight : tempPWidth;
            pixelSize = pixelSize <= 16 ? pixelSize : 16;
            pixelSize = pixelSize >= 4 ? pixelSize : 4;
            /* 16 px = W:1696, H272 */
        };

        if (window.matchMedia("(orientation: portrait)").matches) {
            /* calculate, balance, and set the size of a pixel */
            tempPHeight = Math.floor(windowHeight / 116);
            tempPWidth =  Math.floor(windowWidth / 34);
            balancePixelSize();

            /* adjust placement according to graph to window ratio */
            windowTranslateX = (windowHeight - (windowHeight - (pixelSize * 116)) / 2) * -1;
            windowTranslateY = (windowWidth - (pixelSize * 34)) / 2;
            windowRotateDeg = -90;
        } else if (window.matchMedia("(orientation: landscape)").matches) {
            /* calculate, balance, and set the size of a pixel */
            tempPHeight = Math.floor(windowHeight / 34);
            tempPWidth =  Math.floor(windowWidth / 116);
            balancePixelSize();

            /* adjust placement according to graph to window ratio */
            windowTranslateX = (windowWidth - (pixelSize * 116)) / 2;
            windowTranslateY = (windowHeight - (pixelSize * 34)) / 2; 
            windowRotateDeg = 0;
        }

        /* remove display loader (serves no purpose other than being pretty) */
        setTimeout( () => {loaderDisplay = false}, Math.random() * 1200 | 600);
	};
	
	onMount(() => {		
		window.addEventListener('resize', setPixelSize);
		
		return () => {
			window.removeEventListener('resize', setPixelSize);
		}
	});

    /* run once on page load */
    setPixelSize();
</script>

<div class="butons-container" style="width: {116 * pixelSize}px; height: {34 * pixelSize}px; transform: rotate({windowRotateDeg}deg) translate({windowTranslateX}px, {windowTranslateY}px) ;">
    <CanvasButtons {pixelSize}></CanvasButtons>
    <h1 class="butons-container-debug" style="font-size: {pixelSize / 10}em">{windowWidth} {windowHeight} {pixelSize}</h1>
</div>

{#if loaderDisplay}
    <div class="blanket-loading">
        <div class="blanket-loading-mosaic" style="--cell-size: {64 * (pixelSize / 10)}px">
            <h1 class="blanket-loading-text">Loading...</h1>

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
{/if}

<style>
    .butons-container {
        transform-style: preserve-3D;
		transform-origin: top left;
        position: relative; 
        display: block;
    }

    .butons-container-debug {
        position: absolute;
        color: orangered; 
        font-weight: 500;
        display: block;
        right: 2%;
        top: 2%;
    }

    .blanket-loading {
        justify-content: center;
        flex-direction: column;
        background: #2b2b2b;
        font-family: "Lato";
        align-items: center;
        font-weight: 300;
        font-size: 24px;
        position: fixed;
        display: flex;
        height: 100%;
        width: 100%;
        margin: 0;
        left: 0;
        top: 0;
    }

    .blanket-loading-text {
        position: absolute;
        color: #ffffff; 
        font-weight: 500;
        font-size: 0.6em;
        display: block;
        right: 5%;
        top: 0;
    }

    @media only screen and (orientation: portrait) {
        .blanket-loading-text {
            transform: rotate(-90deg) translateX(-80px);
            transform-style: preserve-3D;
			transform-origin: top left;
            position: absolute;
            color: #ffffff; 
            font-weight: 500;
            font-size: 0.6em;
            display: block;
            left: 5%;
            top: 0;
        }
    }

    .blanket-loading-mosaic {
        --total-size: calc(var(--cells) * (var(--cell-size) + 2 * var(--cell-spacing)));
        height: var(--total-size);
        width: var(--total-size);
        --border-width: 1px;
        --cell-spacing: 1px;
        flex-wrap: wrap;
        display: flex;
        --cells: 4;
    }

    .blanket-loading-mosaic > .cell {
        border: var(--border-width) solid var(--cell-color);
        animation: 1.5s ripple ease infinite;
        background-color: transparent;
        margin: var(--cell-spacing);
        flex: 0 0 var(--cell-size);
        box-sizing: border-box;
        --cell-color: white;
    }

    .blanket-loading-mosaic > .cell.d-1 {
        animation-delay: 100ms;
    }

    .blanket-loading-mosaic > .cell.d-2 {
        animation-delay: 200ms;
    }

    .blanket-loading-mosaic > .cell.d-3 {
        animation-delay: 300ms;
    }

    .blanket-loading-mosaic > .cell.d-4 {
        animation-delay: 400ms;
    }

    .blanket-loading-mosaic > .cell.d-5 {
        animation-delay: 500ms;
    }

    .blanket-loading-mosaic > .cell.d-6 {
        animation-delay: 600ms;
    }

    .blanket-loading-mosaic > .cell:nth-child(1) {
        --cell-color: #d4aee0;
    }

    .blanket-loading-mosaic > .cell:nth-child(2) {
        --cell-color: #8975b4;
    }

    .blanket-loading-mosaic > .cell:nth-child(3) {
        --cell-color: #64518a;
    }

    .blanket-loading-mosaic > .cell:nth-child(4) {
        --cell-color: #565190;
    }

    .blanket-loading-mosaic > .cell:nth-child(5) {
        --cell-color: #44abac;
    }

    .blanket-loading-mosaic > .cell:nth-child(6) {
        --cell-color: #2ca7d8;
    }

    .blanket-loading-mosaic > .cell:nth-child(7) {
        --cell-color: #1482ce;
    }

    .blanket-loading-mosaic > .cell:nth-child(8) {
        --cell-color: #05597c;
    }

    .blanket-loading-mosaic > .cell:nth-child(9) {
        --cell-color: #b2dd57;
    }

    .blanket-loading-mosaic > .cell:nth-child(10) {
        --cell-color: #57c443;
    }

    .blanket-loading-mosaic > .cell:nth-child(11) {
        --cell-color: #05b853;
    }

    .blanket-loading-mosaic > .cell:nth-child(12) {
        --cell-color: #19962e;
    }

    .blanket-loading-mosaic > .cell:nth-child(13) {
        --cell-color: #fdc82e;
    }

    .blanket-loading-mosaic > .cell:nth-child(14) {
        --cell-color: #fd9c2e;
    }

    .blanket-loading-mosaic > .cell:nth-child(15) {
        --cell-color: #d5385a;
    }

    .blanket-loading-mosaic > .cell:nth-child(16) {
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