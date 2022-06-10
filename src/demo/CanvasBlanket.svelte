<script>
    import CanvasButtons from './CanvasButtons.svelte';
    import { stabilizeFunction } from './Tools.js';
    import { isInCanvasMode } from './Stores.js';

    let isPixelSizeLocked = false;
    let isLoaderDisplayed = false;
    let isPageLoaded = false;

    /* DOM accessible globals */
    let windowTranslateX = 0;
    let windowTranslateY = 0;
    let windowRotateDeg = 0;
    let pixelSize = 0;

    function getPixelSize(w, h, min, max) {
        /* makes sense init?! */
        if (isPixelSizeLocked)
            return max;

        /* returns largest acceptable pixel size */
        let pSize = w > h ? h : w;
        pSize = pSize <= max ? pSize : max;
        pSize = pSize >= min ? pSize : min;

        return pSize;
    };

	function setPixelSize() {
        /* get client screen size */
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;

        /* go default on 'em! */
        windowTranslateX = 0;
        windowTranslateY = 0;
        windowRotateDeg = 0;

        if (window.matchMedia("(orientation: portrait)").matches) {
            /* calculate, balance, and set the size of a pixel */
            pixelSize = getPixelSize(Math.floor(windowWidth / 34), Math.floor(windowHeight / 116), 4, 16);

            /* adjust placement according to graph to window ratio */
            let wipHeight = pixelSize * 116;
            let wipWidth = pixelSize * 34;

            /* bad influence! */
            windowRotateDeg = -90;

            /* rotate means translate!!! */
            if (windowHeight < wipHeight) {
                windowTranslateX = wipHeight * -1;
            } else {
                windowTranslateX = (windowHeight - (windowHeight - wipHeight) / 2) * -1;
            }

            /* isPixelSizeLocked? */
            if (windowWidth > wipWidth) { /* definitely not! */
                windowTranslateY = (windowWidth - wipWidth) / 2;
            }
        } else if (window.matchMedia("(orientation: landscape)").matches) {
            /* calculate, balance, and set the size of a pixel */
            pixelSize = getPixelSize(Math.floor(windowWidth / 116), Math.floor(windowHeight / 34), 4, 16);

            /* adjust placement according to graph to window ratio */
            let wipWidth = pixelSize * 116;
            let wipHeight = pixelSize * 34;
            
            if (!isPixelSizeLocked) {
                windowTranslateX = (windowWidth - wipWidth) / 2;
                windowTranslateY = (windowHeight - wipHeight) / 2;
            }
        }

        if (isLoaderDisplayed) { /* hide the pretty display loader */
            setTimeout( () => {isLoaderDisplayed = false}, Math.random() * 1200 | 600);
        }

        console.log(`screen loade: W = ${windowWidth}, H = ${windowHeight}, P = ${pixelSize}`);
	};

    /* set 330ms delay on function, reset if it is called again before executing */
    const stabilizedSetPixelSize = stabilizeFunction(setPixelSize, 330);

    isInCanvasMode.subscribe(value => {
        if (!isPageLoaded) /* add event listener on page load and forget */
            window.addEventListener('resize', stabilizedSetPixelSize);

        isPixelSizeLocked = value;
        isLoaderDisplayed = true;
        isPageLoaded = true;
        setPixelSize();
    });
    
</script>

<div class="butons-container" style="width: {116 * pixelSize}px; height: {34 * pixelSize}px; transform: rotate({windowRotateDeg}deg) translate({windowTranslateX}px, {windowTranslateY}px);">
    <CanvasButtons {pixelSize}></CanvasButtons>
</div>

{#if isLoaderDisplayed}
    <div class="blanket-loading">
        <div class="blanket-loading-mosaic" style="--cell-size: {64 * (pixelSize / 10)}px;">
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