<script>
    import CanvasContainer from './CanvasContainer.svelte'
    export let pixelSize;
    const kValue = '4858487703217654168507377107565676789145697178497253677539145555247620343537955749299116772611982962556356527603203744742682135448820545638134012705381689785851604674225344958377377969928942335793703373498110479735981161931616997837568312568489938311294622859986621379234205529965392091893253288500432782862263410646820171439206408889517627953930924005233285455643232746873900205120036557171717499335122490912065694632935352302178602108137941774883061885522205403967593003199773578952627785152838963495027790689532144351329310799436758088941551';
</script>

<!--constants in braces represent the amount of pixels, as defined by the canvas matrix-->
<div class="buttons" style="width: {116 * pixelSize}px; height: {33 * pixelSize}px; padding-top: {pixelSize}px">
    <div class="container-container" style="width: {116 * pixelSize}px; height: {27 * pixelSize}px">
        <CanvasContainer {pixelSize}></CanvasContainer>
    </div>
    <div class="k-buttons" style="width: {96 * pixelSize}px; height: {6 * pixelSize}px">
        <div  class="k-buttons-value" style="width: {96 * pixelSize}px; height: {2.5 * pixelSize}px">
            <button type="button" style="font-size: {2 * pixelSize - 4}px; width: {8 * pixelSize}px; height: {2.5 * pixelSize}px"><i>k<sub>dec</sub></i></button>
            <textarea style="line-height: {2.5 * pixelSize - 1}px; font-size: {2 * pixelSize - 6}px; width: {88 * pixelSize}px; height: {2.5 * pixelSize}px">{kValue}</textarea>
        </div>
         <div class="k-buttons-action" style="width: {96 * pixelSize}px; height: {2.5 * pixelSize}px">
            <!--60 pixels worth of real estate is left here!-->
            <button class="k-buttons-action-comment" type="button" style="font-size: {2 * pixelSize - 6}px; width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">Comment</button>          
            <button class="k-buttons-action-paste" type="button" style="font-size: {2 * pixelSize - 6}px; width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">Paste</button>
            <button class="k-buttons-action-copy" type="button" style="font-size: {2 * pixelSize - 6}px; width: {12 * pixelSize}px; height: {2.5 * pixelSize}px">Copy</button>
            <div class="k-buttons-action-tools" style="width: {48 * pixelSize}px; height: {2.5 * pixelSize}px">
                <button class="k-buttons-action-tools-brush" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
                <button class="k-buttons-action-tools-eraser" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
                <button class="k-buttons-action-tools-options" type="button" style="width: {2.5 * pixelSize}px; height: {2.5 * pixelSize}px"></button>
            </div>
        </div>
    </div>
</div>

<style>
    .buttons {
        position: relative;
        display: block;
    }

    .container-container {
        position: relative;
        display: block;
    }

    .k-buttons {
        position: relative;
        margin-right: auto;
        margin-left: auto;
        display: block;
    }

    .k-buttons-value {
        margin-bottom: 3px;
        display: flex;
    }

    .k-buttons-value button {
        border-bottom-right-radius: 0;
        border-top-right-radius: 0;
    }

    .k-buttons-value textarea {
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-left: 3px;
        border-left: none;
        overflow: hidden;
        resize: none;
    }

    .k-buttons-action {
        flex-direction: row-reverse;
        display: flex;
    }

    .k-buttons-action > * {
        margin-left: 5px;
    }

    .k-buttons-action-tools {
        flex-direction: row;
        display: flex;
    }

    .k-buttons-action-tools > * {
        background-size: contain;
        border-radius: 100%;
        margin-left: 5px;
    }

    .k-buttons-action-tools-brush {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE4LjEuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMzYuMzggMzYuMzgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM2LjM4IDM2LjM4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8cGF0aCBkPSJNMjEuNzA5LDEwLjU5N2wyLjc4MS0xLjY2MmMtMC4wMi0wLjI3OS0wLjA0Ny0wLjU1My0wLjA3OC0wLjgxOUMyMy43OTgsMi42ODMsMjEuNTExLDAsMjEuNTExLDANCgkJYy01LjI2MiwzLjQ5Ny03LjYxNywxMC4yMjQtNy42MTcsMTAuMjI0bDAuNzcsMi41ODJsLTEuNDI2LTAuNjQ2QzEwLjc3MywxOS4yMzksMTMuNCwyNy4wNCwxMy40LDI3LjA0DQoJCWMwLjIwNywwLjMwOSwwLjQzMiwwLjUyNSwwLjY2MiwwLjY4YzMuMDQ1LTEzLjUwOCw0Ljk5NC0xOC4zODEsNC45OTQtMTguMzgxYy0wLjY4OCwxLjc1NC0yLjUwOCwxMS45NDMtMy42NjQsMTguNjY2DQoJCWMwLjU3Mi0wLjA4MiwxLTAuMzYzLDEtMC4zNjNjOC41NTctOS4zOTEsNy43OTktMTcuMjExLDcuNzk5LTE3LjIxMUMyMy41OTMsMTAuMDg3LDIxLjcwOSwxMC41OTcsMjEuNzA5LDEwLjU5N3oiLz4NCgk8cGF0aCBkPSJNMTQuMDYyLDI3LjcyYy0wLjQzNCwxLjkyLTEuNjk1LDYuMzgxLTIuMTcyLDguNjZsMS4xNjItMS4zNDZjMCwwLDEuMzA1LTMuOTM0LDIuMzQtNy4wMjkNCgkJQzE0Ljk5LDI4LjA2NCwxNC41MTcsMjguMDIxLDE0LjA2MiwyNy43MnoiLz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCgk8Zz4NCgk8L2c+DQoJPGc+DQoJPC9nPg0KCTxnPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K);
    }

    .k-buttons-action-tools-eraser {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxnPg0KCQk8cGF0aCBkPSJNNDk1LjI3NiwxMzMuOTZMMzc3LjAzMiwxNS43MTVjLTE5LjYwNS0xOS42MDgtNTEuMzQtMTkuNjA5LTcwLjk0NiwwTDQwLjM3LDI4MS40MjgNCgkJCWMtMTkuNTU3LDE5LjU2LTE5LjU1Nyw1MS4zODYsMC4wMDEsNzAuOTQ2bDYxLjE1Myw2MS4xNTNjOS40NzUsOS40NzYsMjIuMDc0LDE0LjY5MywzNS40NzMsMTQuNjkzaDExNC4xODgNCgkJCWMxMy40LDAsMjUuOTk4LTUuMjE5LDM1LjQ3My0xNC42OTNsMjUuNjc4LTI1LjY3OHYtMC4wMDFsMTgyLjk0MS0xODIuOTQyQzUxNC44MzcsMTg1LjM0Nyw1MTQuODM3LDE1My41Miw0OTUuMjc2LDEzMy45NnoNCgkJCSBNMjYzLjAwOSwzODkuODc4Yy0zLjE1OCwzLjE1OC03LjM1OCw0Ljg5Ny0xMS44MjQsNC44OTdIMTM2Ljk5N2MtNC40NjcsMC04LjY2Ni0xLjczOS0xMS44MjQtNC44OTdsLTYxLjE1Mi02MS4xNTINCgkJCWMtNi41MjEtNi41MjEtNi41MjEtMTcuMTI5LTAuMDAxLTIzLjY1bDcwLjk0OC03MC45NDhsMTQxLjg5NSwxNDEuODk1TDI2My4wMDksMzg5Ljg3OHogTTQ3MS42MjksMTgxLjI1OGwtMzIuMTEzLDMyLjExMw0KCQkJTDI5Ny42MjIsNzEuNDc1bDMyLjExMy0zMi4xMTNjNi41MjItNi41MjEsMTcuMTI5LTYuNTE5LDIzLjY1LDBsMTE4LjI0NCwxMTguMjQ1DQoJCQlDNDc4LjE0OCwxNjQuMTI4LDQ3OC4xNDgsMTc0LjczNyw0NzEuNjI5LDE4MS4yNTh6Ii8+DQoJPC9nPg0KPC9nPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik00OTUuMjc4LDQ3Ny41NDZIMTYuNzIyQzcuNDg3LDQ3Ny41NDYsMCw0ODUuMDM0LDAsNDk0LjI2OXM3LjQ4NywxNi43MjIsMTYuNzIyLDE2LjcyMmg0NzguNTU1DQoJCQljOS4yMzUsMCwxNi43MjItNy40ODcsMTYuNzIyLTE2LjcyMlM1MDQuNTEzLDQ3Ny41NDYsNDk1LjI3OCw0NzcuNTQ2eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K);
    }

    .k-buttons-action-tools-options {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjQ1LjU4cHgiIGhlaWdodD0iNDUuNThweCIgdmlld0JveD0iMCAwIDQ1LjU4IDQ1LjU4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0NS41OCA0NS41ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQoJPg0KPGc+DQoJPHBhdGggZD0iTTAuMDc0LDMzLjUzMmMxLjc0MS03LjQyLDcuMTYxLTE3Ljc1OCwyMy41NTQtMTkuOTQyVjcuMDQ3YzAtMS4zNjQsMC44MjctMi41OTMsMi4wODctMy4xMTNzMi43MTItMC4yMjksMy42NzUsMC43MzcNCgkJTDQ0LjI3NSwxOS42M2MxLjczOSwxLjc0OCwxLjc0LDQuNTcyLDAuMDAxLDYuMzJMMjkuMzksNDAuOTA5Yy0wLjk2MSwwLjk2Ni0yLjQxNSwxLjI1OC0zLjY3NiwwLjczNw0KCQljLTEuMjYxLTAuNTIxLTIuMDg3LTEuNzUtMi4wODctMy4xMTN2LTYuMzMxYy01LjU5MywwLjAwNy0xMy42NTcsMC43NDMtMTkuMzkyLDQuMzEzYy0wLjk1MywwLjU5NC0yLjE2OCwwLjU1NS0zLjA4LTAuMTAxDQoJCUMwLjI0NSwzNS43NjItMC4xODQsMzQuNjI0LDAuMDc0LDMzLjUzMnoiLz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K);
    }
</style>