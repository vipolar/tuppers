<script>
    import CanvasButtonsBar from './CanvasButtonsBar.svelte';
    import CanvasContainer from './CanvasContainer.svelte';
    import { CanvasMode, BrushMode } from './Stores.js';
    import { stabilizeFunction } from './Tools.js';
    import { onMount } from 'svelte';

    /* canvas state variables*/
    let isDisplayLoader = false;
    let isDisplayFixer = false;
    let isInCanvasMode = false;
    let isInBrushMode = false;
    let isInMoveMode = true;

    /* DOM accessible globals */
    let windowTranslateX = 0;
    let windowTranslateY = 0;
    let windowRotateDeg = 0;
    let loaderCubeSize = 0;
    let pixelSize = 0;

    function getPixelSize(w, h, min, max) {
        /* returns largest acceptable pixel size */
        let pSize = w > h ? h : w;
        pSize = pSize <= max ? pSize : max;
        pSize = pSize >= min ? pSize : min;

        /* gotta trust the guy that calculates it */
        loaderCubeSize = 64 * (pSize / 10);

        /* makes sense init?! */
        if (!isInCanvasMode)
            return pSize;
        else
            return max;
    };

	function setPixelSize() {
        /* necessary evil */
        isDisplayFixer = true;

        /* get client screen size */
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;

        /* variables don't hurt */
        let rowPixels = 116;
        let colPixels = isInCanvasMode ? 27 : 34;

        /* go default on 'em! */
        windowTranslateX = 0;
        windowTranslateY = 0;
        windowRotateDeg = 0;

        if (window.matchMedia("(orientation: portrait)").matches) {
            /* calculate, balance, and set the size of a pixel */
            pixelSize = getPixelSize(Math.floor(windowWidth / colPixels), Math.floor(windowHeight / rowPixels), 4, 16);

            /* adjust placement according to graph to window ratio */
            let wipWidth = pixelSize * colPixels;
            let wipHeight = pixelSize * rowPixels;

            /* bad influence! */
            windowRotateDeg = -90;

            /* rotate means translate!!! */
            if (windowHeight < wipHeight) {
                windowTranslateX = wipHeight * -1;
            } else {
                windowTranslateX = (windowHeight - (windowHeight - wipHeight) / 2) * -1;
            }

            /* isInCanvasMode? */
            if (windowWidth > wipWidth) { /* probably not... */
                windowTranslateY = (windowWidth - wipWidth) / 2;
            }
        } else if (window.matchMedia("(orientation: landscape)").matches) {
            /* calculate, balance, and set the size of a pixel */
            pixelSize = getPixelSize(Math.floor(windowWidth / rowPixels), Math.floor(windowHeight / colPixels), 4, 16);

            /* adjust placement according to graph to window ratio */
            let wipWidth = pixelSize * rowPixels;
            let wipHeight = pixelSize * colPixels;
            
            if (!isInCanvasMode) {
                windowTranslateX = (windowWidth - wipWidth) / 2;
                windowTranslateY = (windowHeight - wipHeight) / 2;
            }
        }

        if (isDisplayLoader) { /* hide the pretty display loader */
            setTimeout( () => {isDisplayLoader = false}, Math.random() * 1200 | 600);
        }

        /* down with the necessary evil! (in 100ms...) */
        setTimeout( () => {isDisplayFixer = false}, 300);
        //console.log(`page loaded: width = ${windowWidth}, height = ${windowHeight}, pixelSize = ${pixelSize}px.`);
	};

    /* set 330ms delay on function, reset if it is called again before executing */
    const stabilizedSetPixelSize = stabilizeFunction(setPixelSize, 150);

    onMount(() => {	/* mount it and ride it to hell, motherfuckers! */
		window.addEventListener('resize', stabilizedSetPixelSize);
        isDisplayLoader = true;
        setPixelSize();
		
		return () => { /* and at this point i'm too afraid to ask... */
			window.removeEventListener('resize', stabilizedSetPixelSize);
		}
	});

    /* events and handlers */
    function toggleCanvasMode(e) {
        isInCanvasMode = !isInCanvasMode;
        isDisplayLoader = true;
        isInMoveMode = true;
        setPixelSize();

        CanvasMode.update(n => isInCanvasMode);
    }

    function buttonsClickHandleBrush(e) {
        isInMoveMode = false;
        isInBrushMode = true;
        
        const buttons = e.target.parentElement.children;
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.backgroundColor = "#dddddd";
            buttons[i].style.borderColor = "#ff0000";
        }

        /* not efficient but who has the time!? */
        e.target.style.backgroundColor = "#8b000099";
        e.target.style.borderColor = "#000000";

        BrushMode.update(n => isInBrushMode);
    };

    function buttonsClickHandleErase(e) {
        isInMoveMode = false;
        isInBrushMode = false;

        const buttons = e.target.parentElement.children;
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.backgroundColor = "#dddddd";
            buttons[i].style.borderColor = "#ff0000";
        }

        /* not efficient but who has the time!? */
        e.target.style.backgroundColor = "#8b000099";
        e.target.style.borderColor = "#000000";

        BrushMode.update(n => isInBrushMode);
    };

    function buttonsClickHandleMove(e) {
        isInMoveMode = true;

        const buttons = e.target.parentElement.children;
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.backgroundColor = "#dddddd";
            buttons[i].style.borderColor = "#ff0000";
        }
    };

    function buttonsClickHandleExit(e) {
        toggleCanvasMode();
    };
</script>

<div class="basecontrol">
    {#if isInCanvasMode}
        <div class="child-component-container" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px; transform: rotate({windowRotateDeg}deg) translate({windowTranslateX}px, {windowTranslateY}px);">
            <CanvasContainer {pixelSize} on:click={toggleCanvasMode}></CanvasContainer>
            {#if isInMoveMode}
                <div class="child-component-container-cover" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px;"></div>
            {/if}
        </div>
        <div class="basecontrol-buttons" style="width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">
            <button on:click={buttonsClickHandleBrush} class="basecontrol-buttons-brush" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
            <button on:click={buttonsClickHandleErase} class="basecontrol-buttons-erase" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
            <button on:click={buttonsClickHandleMove} class="basecontrol-buttons-move" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
            <button on:click={buttonsClickHandleExit} class="basecontrol-buttons-exit" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
        </div>
    {:else}
        <div class="child-component-container" style="width: {116 * pixelSize}px; height: {34 * pixelSize}px; transform: rotate({windowRotateDeg}deg) translate({windowTranslateX}px, {windowTranslateY}px);">
            <CanvasButtonsBar {pixelSize} on:click={toggleCanvasMode}></CanvasButtonsBar>
        </div>
    {/if}

    {#if isDisplayLoader}
        <div class="base-loading">
            <div class="base-loading-mosaic" style="--cell-size: {loaderCubeSize}px;">
                <h1 class="base-loading-text">Loading...</h1>

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
    {:else if isDisplayFixer}
        <div class="base-resize-fixer"></div>
    {/if}
</div>

<style>
    .basecontrol {
        overflow: scroll;
        height: 100vh;
        width: 100vw;
    }

    .child-component-container {
        transform-style: preserve-3D;
		transform-origin: top left;
        position: relative;
        display: block;
    }

    .child-component-container-cover {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIFVwbG9hZGVkIHRvIFNWR1JlcG8gaHR0cHM6Ly93d3cuc3ZncmVwby5jb20gLS0+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgdmlld0JveD0iMCAwIDMyIDMyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMiAzMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8cGF0aCBpZD0idG91Y2gtLWlkXzFfIiBkPSJNMTcuMzA0LDMxLjM2Yy0wLjE4NSwwLTAuMzQyLTAuMTQxLTAuMzU4LTAuMzI4Yy0wLjEwNy0xLjE5NC0wLjg3Ny0yLjQ3OS0yLjMxNS0yLjQ3OQoJYy0xLjMyLDAtMi4wODgsMC43NDMtMi44OTgsMS45NDNjLTAuMTEsMC4xNjYtMC4zMzQsMC4yMDgtMC41LDAuMDk4Yy0wLjE2NS0wLjExMS0wLjIwOC0wLjMzNi0wLjA5Ny0wLjUKCWMwLjc5My0xLjE3NSwxLjc2NS0yLjI2MiwzLjQ5NS0yLjI2MmMxLjg5LDAsMi44OTYsMS42MjYsMy4wMzIsMy4xMzZjMC4wMTgsMC4xOTgtMC4xMjgsMC4zNzMtMC4zMjYsMC4zOTEKCUMxNy4zMjUsMzEuMzU5LDE3LjMxNCwzMS4zNiwxNy4zMDQsMzEuMzZ6IE0yMS4yMjgsMzAuNDE2Yy0wLjA2NCwwLTAuMTI5LTAuMDE4LTAuMTg4LTAuMDU0Yy0xLjkyMS0xLjE3Ni0zLjExNC0zLjA2Ny0zLjExNC00LjkzNwoJYzAtMC42ODQsMC4xMzgtMS40MzgsMC4zNjctMi4wMTdjMC4wNzQtMC4xODUsMC4yODEtMC4yNzMsMC40NjgtMC4yMDJjMC4xODUsMC4wNzQsMC4yNzUsMC4yODMsMC4yMDIsMC40NjgKCWMtMC4yMzMsMC41ODgtMC4zMTYsMS4yOS0wLjMxNiwxLjc1MWMwLDEuNjIsMS4wNjIsMy4yNzYsMi43NzEsNC4zMjNjMC4xNjksMC4xMDQsMC4yMjMsMC4zMjUsMC4xMTgsMC40OTUKCUMyMS40NjcsMzAuMzU0LDIxLjM0OSwzMC40MTYsMjEuMjI4LDMwLjQxNnogTTguNTE1LDI5LjM2OWMtMC4xMTcsMC0wLjIzMS0wLjA1Ny0wLjMtMC4xNjFjLTAuMTEtMC4xNjYtMC4wNjUtMC4zOSwwLjEwMS0wLjQ5OQoJYzIuODI0LTEuODczLDUuMTA3LTMuNjg4LDcuNDA0LTUuODg0YzEuMjA3LTEuMTU1LDMuMjMtMy40NzEsMy4yMy02LjAwOWMwLTEuNTctMS4xMTUtMy4xOTMtMi45ODEtMy4xOTMKCWMtMS43MiwwLTMuMDE0LDEuOTQzLTQuMjY1LDMuODIzYy0wLjY1OSwwLjk4OS0xLjI4MSwxLjkyNC0xLjk3MSwyLjU5OGMtMS44ODgsMS44NDYtMy44NDQsMi45NDQtNi4wMjEsNC4wOQoJYy0wLjE3NywwLjA5My0wLjM5NCwwLjAyNC0wLjQ4Ni0wLjE1Yy0wLjA5My0wLjE3Ny0wLjAyNS0wLjM5NCwwLjE1MS0wLjQ4NmMyLjEyNi0xLjExOSw0LjAzNC0yLjE4OSw1Ljg1My0zLjk2OQoJYzAuNjM1LTAuNjIsMS4yMzctMS41MjQsMS44NzQtMi40ODFjMS4zNTYtMi4wMzcsMi43NTktNC4xNDMsNC44NjUtNC4xNDNjMi4zMTcsMCwzLjcwMiwxLjk5LDMuNzAyLDMuOTEzCgljMCwyLjgwNi0yLjE2NCw1LjI5NS0zLjQ1Myw2LjUyOWMtMi4zMjksMi4yMjgtNC42NDMsNC4wNjctNy41MDQsNS45NjRDOC42NTIsMjkuMzUsOC41ODMsMjkuMzY5LDguNTE1LDI5LjM2OXogTTI1LjE3MywyOC4yMgoJYy0wLjA0NCwwLTAuMDg5LTAuMDA5LTAuMTMyLTAuMDI1Yy0zLjI4My0xLjI5LTMuOTczLTMuOTQ2LTMuOTczLTUuOTQ2YzAtMC44NjYsMC4xNzEtMS42OCwwLjM1Mi0yLjU0MQoJYzAuMjEzLTEuMDIsMC40MzQtMi4wNzMsMC40MzQtMy40MTFjMC0yLjQwMy0yLjA0NS01LjczMS01Ljg4NS01LjczMWMtMy4yMzQsMC01LjE4OSwyLjQ4OS02LjA2NiwzLjk3MwoJYy0wLjg0MiwxLjQyNS0zLjE4OSw0Ljg4NC02Ljc3OCw2LjIxMWMtMC4xODgsMC4wNjYtMC4zOTQtMC4wMjYtMC40NjMtMC4yMTNzMC4wMjYtMC4zOTQsMC4yMTMtMC40NjMKCWMyLjM0LTAuODY1LDQuNzM1LTMuMDcxLDYuNDA4LTUuOTAyYzAuOTU2LTEuNjE2LDMuMDk0LTQuMzI2LDYuNjg2LTQuMzI2YzMuOTUxLDAsNi42MDUsMy4zMzUsNi42MDUsNi40NTEKCWMwLDEuNDEyLTAuMjM5LDIuNTUyLTAuNDUsMy41NThjLTAuMTcyLDAuODIzLTAuMzM1LDEuNjAyLTAuMzM1LDIuMzk0YzAsMS43NzYsMC42MDksNC4xMzQsMy41MTYsNS4yNzYKCWMwLjE4NSwwLjA3MiwwLjI3NiwwLjI4MSwwLjIwMywwLjQ2N0MyNS40NTIsMjguMTMzLDI1LjMxNiwyOC4yMiwyNS4xNzMsMjguMjJ6IE01LjgyMywyNy4zODZjLTAuMTIxLDAtMC4yMzktMC4wNjItMC4zMDctMC4xNzIKCWMtMC4xMDQtMC4xNjktMC4wNTEtMC4zOTEsMC4xMTgtMC40OTVjMy4yNy0yLjAxMyw3LjY2Ni01LjM0NywxMC4wMzctOS43OTljMC4wOTMtMC4xNzYsMC4zMS0wLjI0MywwLjQ4Ny0wLjE0OAoJYzAuMTc1LDAuMDk0LDAuMjQyLDAuMzEyLDAuMTQ4LDAuNDg3Yy0yLjQ0OCw0LjU5NS02Ljk1LDguMDE1LTEwLjI5NiwxMC4wNzRDNS45NTMsMjcuMzY4LDUuODg4LDI3LjM4Niw1LjgyMywyNy4zODZ6CgkgTTI3LjA2NSwyNS43ODZjLTAuMDQ4LDAtMC4wOTctMC4wMS0wLjE0NC0wLjAzYy0yLjIzOC0wLjk3NC0yLjY3Ny0yLjM2MS0yLjY3Ny00LjQzMWMwLTEuMjkxLDAuMTQ5LTEuOTM5LDAuMzA3LTIuNjI3CgljMC4xNjktMC43MzQsMC4zNDMtMS40OTMsMC4zNDMtMy4yMDFjMC0zLjgzMy0zLjQxMi03Ljk3LTguOTI2LTcuOTdjLTQuMTY1LDAtNi4xNzksMi4wNzgtNy44ODYsNC4yMDYKCWMtMC4xODgsMC4yMzQtMC4zOTMsMC41MDctMC42MTUsMC44MDNjLTEuMDYsMS40MTItMi41MTEsMy4zNDUtNC4zMzMsNC4wODNjLTAuMTg2LDAuMDc1LTAuMzk1LTAuMDE0LTAuNDY5LTAuMTk4CgljLTAuMDc1LTAuMTg1LDAuMDE0LTAuMzk0LDAuMTk4LTAuNDY5YzEuNjM3LTAuNjY0LDMuMDE5LTIuNTA0LDQuMDI4LTMuODQ4YzAuMjI4LTAuMzAzLDAuNDM3LTAuNTgzLDAuNjI5LTAuODIxCgljMS44MTYtMi4yNjUsMy45NjQtNC40NzYsOC40NDctNC40NzZjNS45NTgsMCw5LjY0Niw0LjUxMSw5LjY0Niw4LjY5YzAsMS43ODktMC4xOTIsMi42MjUtMC4zNjEsMy4zNjIKCWMtMC4xNDgsMC42NDYtMC4yODgsMS4yNTctMC4yODgsMi40NjZjMCwyLjExNSwwLjU0NSwzLjAzMiwyLjI0MywzLjc3MWMwLjE4MywwLjA3OSwwLjI2NiwwLjI5MSwwLjE4NywwLjQ3NAoJQzI3LjMzNywyNS43MDUsMjcuMjA0LDI1Ljc4NiwyNy4wNjUsMjUuNzg2eiBNMjcuNDc2LDIyLjc4M2MtMC4wNzQsMC0wLjE0OC0wLjAyMi0wLjIxMy0wLjA2OWMtMC4xNi0wLjExOC0wLjE5NS0wLjM0My0wLjA3OC0wLjUwNAoJYzAuODk3LTEuMjI4LDEuNDU1LTMuMzY2LDEuNDU1LTUuNTgyYzAtMS4yMDgtMC4wOTctMi41MzEtMC44MDEtNC4wMzJjLTAuMDg0LTAuMTgtMC4wMDctMC4zOTUsMC4xNzMtMC40NzkKCWMwLjE4LTAuMDgzLDAuMzk1LTAuMDA4LDAuNDc5LDAuMTczYzAuNzY2LDEuNjMzLDAuODY5LDMuMTA5LDAuODY5LDQuMzM4YzAsMi4zOTYtMC41OTYsNC42NDMtMS41OTQsNi4wMDgKCUMyNy42OTUsMjIuNzMxLDI3LjU4NiwyMi43ODMsMjcuNDc2LDIyLjc4M3ogTTMuNzMxLDExLjk5MWMtMC4wNjgsMC0wLjEzNy0wLjAxOS0wLjE5OC0wLjA1OWMtMC4xNjYtMC4xMDktMC4yMTItMC4zMzMtMC4xMDMtMC40OTkKCWMyLjE2NC0zLjI4NSw1LjgxOC03LjY1MiwxMi41MzgtNy42NTJjNC42NjIsMCw4Ljk3OSwyLjMyNywxMS41NDcsNi4yMjZjMC4xMDksMC4xNjcsMC4wNjMsMC4zOS0wLjEwMywwLjQ5OQoJYy0wLjE2NSwwLjEwOS0wLjM4OSwwLjA2NC0wLjQ5OS0wLjEwM2MtMi40MzQtMy42OTYtNi41MjUtNS45MDItMTAuOTQ1LTUuOTAyYy02LjM3MiwwLTkuODY0LDQuMTgzLTExLjkzNyw3LjMyOQoJQzMuOTYzLDExLjkzNSwzLjg0OCwxMS45OTEsMy43MzEsMTEuOTkxeiBNMjYuNzczLDUuOTI4Yy0wLjA5NCwwLTAuMTg3LTAuMDM2LTAuMjU3LTAuMTA4Yy0yLjc2My0yLjgyMi02LjU0OC00LjQ0Ny0xMC4zODUtNC40NgoJYy0wLjAxOSwwLTAuMDM4LDAtMC4wNTcsMGMtNC4wODgsMC03LjczOCwxLjUyNC0xMC41NTgsNC40MUM1LjM3OCw1LjkxMiw1LjE0OSw1LjkxNCw1LjAwOCw1Ljc3NgoJQzQuODY1LDUuNjM3LDQuODYzLDUuNDA5LDUuMDAyLDUuMjY3QzcuOTYsMi4yMzksMTEuNzg5LDAuNjQsMTYuMDc0LDAuNjRjMC4wMiwwLDAuMDQsMCwwLjA2LDAKCWM0LjAyOCwwLjAxNCw4LjAwMSwxLjcxOCwxMC44OTYsNC42NzZjMC4xNCwwLjE0MiwwLjEzNywwLjM3LTAuMDA1LDAuNTA5QzI2Ljk1NSw1Ljg5NCwyNi44NjQsNS45MjgsMjYuNzczLDUuOTI4eiIvPgo8cmVjdCBpZD0iX1RyYW5zcGFyZW50X1JlY3RhbmdsZSIgc3R5bGU9ImZpbGw6bm9uZTsiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIvPgo8L3N2Zz4K);
        background-color: #00b3ff88;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 5%;
        position: absolute;
        touch-action: auto;
        display: block;
        left: 0;
        top: 0;
    }

    .base-resize-fixer {
        position: fixed;
        display: block;
        height: 100%;
        width: 100%;
        margin: 0;
        left: 0;
        top: 0;
    }

    /* dem buttons, babee!!! */
    .basecontrol-buttons {
        flex-direction: row;
        position: fixed;
        display: flex;
        right: 2vh;
        top: 2vw;
    }

    .basecontrol-buttons > * {
        background-size: contain;
        border-radius: 100%;
        margin-left: 5px;
    }

    .basecontrol-buttons-brush {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE4LjEuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMzYuMzggMzYuMzgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM2LjM4IDM2LjM4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8cGF0aCBkPSJNMjEuNzA5LDEwLjU5N2wyLjc4MS0xLjY2MmMtMC4wMi0wLjI3OS0wLjA0Ny0wLjU1My0wLjA3OC0wLjgxOUMyMy43OTgsMi42ODMsMjEuNTExLDAsMjEuNTExLDANCgkJYy01LjI2MiwzLjQ5Ny03LjYxNywxMC4yMjQtNy42MTcsMTAuMjI0bDAuNzcsMi41ODJsLTEuNDI2LTAuNjQ2QzEwLjc3MywxOS4yMzksMTMuNCwyNy4wNCwxMy40LDI3LjA0DQoJCWMwLjIwNywwLjMwOSwwLjQzMiwwLjUyNSwwLjY2MiwwLjY4YzMuMDQ1LTEzLjUwOCw0Ljk5NC0xOC4zODEsNC45OTQtMTguMzgxYy0wLjY4OCwxLjc1NC0yLjUwOCwxMS45NDMtMy42NjQsMTguNjY2DQoJCWMwLjU3Mi0wLjA4MiwxLTAuMzYzLDEtMC4zNjNjOC41NTctOS4zOTEsNy43OTktMTcuMjExLDcuNzk5LTE3LjIxMUMyMy41OTMsMTAuMDg3LDIxLjcwOSwxMC41OTcsMjEuNzA5LDEwLjU5N3oiLz4NCgk8cGF0aCBkPSJNMTQuMDYyLDI3LjcyYy0wLjQzNCwxLjkyLTEuNjk1LDYuMzgxLTIuMTcyLDguNjZsMS4xNjItMS4zNDZjMCwwLDEuMzA1LTMuOTM0LDIuMzQtNy4wMjkNCgkJQzE0Ljk5LDI4LjA2NCwxNC41MTcsMjguMDIxLDE0LjA2MiwyNy43MnoiLz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K);
    }

    .basecontrol-buttons-erase {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxnPg0KCQk8cGF0aCBkPSJNNDk1LjI3NiwxMzMuOTZMMzc3LjAzMiwxNS43MTVjLTE5LjYwNS0xOS42MDgtNTEuMzQtMTkuNjA5LTcwLjk0NiwwTDQwLjM3LDI4MS40MjgNCgkJCWMtMTkuNTU3LDE5LjU2LTE5LjU1Nyw1MS4zODYsMC4wMDEsNzAuOTQ2bDYxLjE1Myw2MS4xNTNjOS40NzUsOS40NzYsMjIuMDc0LDE0LjY5MywzNS40NzMsMTQuNjkzaDExNC4xODgNCgkJCWMxMy40LDAsMjUuOTk4LTUuMjE5LDM1LjQ3My0xNC42OTNsMjUuNjc4LTI1LjY3OHYtMC4wMDFsMTgyLjk0MS0xODIuOTQyQzUxNC44MzcsMTg1LjM0Nyw1MTQuODM3LDE1My41Miw0OTUuMjc2LDEzMy45NnoNCgkJCSBNMjYzLjAwOSwzODkuODc4Yy0zLjE1OCwzLjE1OC03LjM1OCw0Ljg5Ny0xMS44MjQsNC44OTdIMTM2Ljk5N2MtNC40NjcsMC04LjY2Ni0xLjczOS0xMS44MjQtNC44OTdsLTYxLjE1Mi02MS4xNTINCgkJCWMtNi41MjEtNi41MjEtNi41MjEtMTcuMTI5LTAuMDAxLTIzLjY1bDcwLjk0OC03MC45NDhsMTQxLjg5NSwxNDEuODk1TDI2My4wMDksMzg5Ljg3OHogTTQ3MS42MjksMTgxLjI1OGwtMzIuMTEzLDMyLjExMw0KCQkJTDI5Ny42MjIsNzEuNDc1bDMyLjExMy0zMi4xMTNjNi41MjItNi41MjEsMTcuMTI5LTYuNTE5LDIzLjY1LDBsMTE4LjI0NCwxMTguMjQ1DQoJCQlDNDc4LjE0OCwxNjQuMTI4LDQ3OC4xNDgsMTc0LjczNyw0NzEuNjI5LDE4MS4yNTh6Ii8+DQoJPC9nPg0KPC9nPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik00OTUuMjc4LDQ3Ny41NDZIMTYuNzIyQzcuNDg3LDQ3Ny41NDYsMCw0ODUuMDM0LDAsNDk0LjI2OXM3LjQ4NywxNi43MjIsMTYuNzIyLDE2LjcyMmg0NzguNTU1DQoJCQljOS4yMzUsMCwxNi43MjItNy40ODcsMTYuNzIyLTE2LjcyMlM1MDQuNTEzLDQ3Ny41NDYsNDk1LjI3OCw0NzcuNTQ2eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K);
    }

    .basecontrol-buttons-move {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgdmlld0JveD0iMCAwIDE3OTIgMTc5MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTc5MiAxNzkyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+Cjxwb2x5Z29uIHBvaW50cz0iNjI2LjQsMTAxMS45IDM3Ny40LDEwMTEuOSAzNzcuNCwxMjcyIDAuMyw4OTcuMyAzNzcuNCw1MjAuMyAzNzcuNCw3NzQuOCA2MjYsNzc0LjggIi8+Cjxwb2x5Z29uIHBvaW50cz0iNzgyLjMsNjIyLjUgNzgyLjMsMzc3LjkgNTE5LjgsMzc3LjkgODk2LjEsMCAxMjcwLjgsMzc3LjEgMTAxNy44LDM3Ny4xIDEwMTcuOCw2MjUuNyAiLz4KPHBvbHlnb24gcG9pbnRzPSIxMDExLjQsMTE2MS41IDEwMTEuNCwxNDE1LjIgMTI3MS42LDE0MTUuMiA4OTYuMSwxNzkxLjUgNTE5LjgsMTQxNS4yIDc3NC40LDE0MTUuMiA3NzQuNCwxMTY1LjggIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTQxNi40LDUxNS41IDE3OTEuMSw4OTIuNiAxNDE2LjQsMTI2Ny4zIDE0MTYuNCwxMDE3LjkgMTE2NS44LDEwMTcuOSAxMTY1LjgsNzg0LjQgMTQxNy4yLDc4NC40ICIvPgo8L3N2Zz4K);
    }

    .basecontrol-buttons-exit {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgd2lkdGg9IjEwMHB4IiBoZWlnaHQ9IjEwMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIGQ9Ik04NC43MDcsNjguNzUyTDY1Ljk1MSw0OS45OThsMTguNzUtMTguNzUyYzAuNzc3LTAuNzc3LDAuNzc3LTIuMDM2LDAtMi44MTNMNzEuNTY2LDE1LjI5NQoJYy0wLjc3Ny0wLjc3Ny0yLjAzNy0wLjc3Ny0yLjgxNCwwTDQ5Ljk5OSwzNC4wNDdsLTE4Ljc1LTE4Ljc1MmMtMC43NDYtMC43NDctMi4wNjctMC43NDctMi44MTQsMEwxNS4yOTcsMjguNDMxCgljLTAuMzczLDAuMzczLTAuNTgzLDAuODgtMC41ODMsMS40MDdjMCwwLjUyNywwLjIxLDEuMDM0LDAuNTgzLDEuNDA3TDM0LjA1LDQ5Ljk5OEwxNS4yOTQsNjguNzUzCgljLTAuMzczLDAuMzc0LTAuNTgzLDAuODgtMC41ODMsMS40MDdjMCwwLjUyOCwwLjIxLDEuMDM1LDAuNTgzLDEuNDA3bDEzLjEzNiwxMy4xMzdjMC4zNzMsMC4zNzMsMC44ODEsMC41ODMsMS40MSwwLjU4MwoJYzAuNTI1LDAsMS4wMzEtMC4yMSwxLjQwNC0wLjU4M2wxOC43NTUtMTguNzU1bDE4Ljc1NiwxOC43NTRjMC4zODksMC4zODgsMC44OTYsMC41ODMsMS40MDcsMC41ODNjMC41MTEsMCwxLjAxOS0wLjE5NSwxLjQwOC0wLjU4MwoJbDEzLjEzOC0xMy4xMzdDODUuNDg0LDcwLjc4OSw4NS40ODQsNjkuNTMsODQuNzA3LDY4Ljc1MnoiLz4KPC9zdmc+Cg==);
    }

    /* pretty pretty loader */
    .base-loading {
        justify-content: center;
        flex-direction: column;
        background: #2b2b2b;
        font-family: "Lato";
        align-items: center;
        font-weight: 300;
        font-size: 24px;
        position: fixed;
        display: flex;
        height: 100vh;
        width: 100vw;
        margin: 0;
        left: 0;
        top: 0;
    }

    .base-loading-text {
        position: absolute;
        color: #ffffff; 
        font-weight: 500;
        font-size: 0.6em;
        display: block;
        right: 5%;
        top: 0;
    }

    @media only screen and (orientation: portrait) {
        .base-loading-text {
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

    .base-loading-mosaic {
        --total-size: calc(var(--cells) * (var(--cell-size) + 2 * var(--cell-spacing)));
        height: var(--total-size);
        width: var(--total-size);
        --border-width: 1px;
        --cell-spacing: 1px;
        flex-wrap: wrap;
        display: flex;
        --cells: 4;
    }

    .base-loading-mosaic > .cell {
        border: var(--border-width) solid var(--cell-color);
        animation: 1.5s ripple ease infinite;
        background-color: transparent;
        margin: var(--cell-spacing);
        flex: 0 0 var(--cell-size);
        box-sizing: border-box;
        --cell-color: white;
    }

    .base-loading-mosaic > .cell.d-1 {
        animation-delay: 100ms;
    }

    .base-loading-mosaic > .cell.d-2 {
        animation-delay: 200ms;
    }

    .base-loading-mosaic > .cell.d-3 {
        animation-delay: 300ms;
    }

    .base-loading-mosaic > .cell.d-4 {
        animation-delay: 400ms;
    }

    .base-loading-mosaic > .cell.d-5 {
        animation-delay: 500ms;
    }

    .base-loading-mosaic > .cell.d-6 {
        animation-delay: 600ms;
    }

    .base-loading-mosaic > .cell:nth-child(1) {
        --cell-color: #d4aee0;
    }

    .base-loading-mosaic > .cell:nth-child(2) {
        --cell-color: #8975b4;
    }

    .base-loading-mosaic > .cell:nth-child(3) {
        --cell-color: #64518a;
    }

    .base-loading-mosaic > .cell:nth-child(4) {
        --cell-color: #565190;
    }

    .base-loading-mosaic > .cell:nth-child(5) {
        --cell-color: #44abac;
    }

    .base-loading-mosaic > .cell:nth-child(6) {
        --cell-color: #2ca7d8;
    }

    .base-loading-mosaic > .cell:nth-child(7) {
        --cell-color: #1482ce;
    }

    .base-loading-mosaic > .cell:nth-child(8) {
        --cell-color: #05597c;
    }

    .base-loading-mosaic > .cell:nth-child(9) {
        --cell-color: #b2dd57;
    }

    .base-loading-mosaic > .cell:nth-child(10) {
        --cell-color: #57c443;
    }

    .base-loading-mosaic > .cell:nth-child(11) {
        --cell-color: #05b853;
    }

    .base-loading-mosaic > .cell:nth-child(12) {
        --cell-color: #19962e;
    }

    .base-loading-mosaic > .cell:nth-child(13) {
        --cell-color: #fdc82e;
    }

    .base-loading-mosaic > .cell:nth-child(14) {
        --cell-color: #fd9c2e;
    }

    .base-loading-mosaic > .cell:nth-child(15) {
        --cell-color: #d5385a;
    }

    .base-loading-mosaic > .cell:nth-child(16) {
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