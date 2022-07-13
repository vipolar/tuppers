<script>
	//import Display from './Display.svelte'
	import Canvas from './Canvas.svelte'

	let framePixelBoxShadow = "#ffffff";
	let framePixelBackground = "#a7a7a7";
	let canvasPixelBoxShadow = "#ffffff";
	let canvasPixelBackground = "#999999";
	let canvasPixelBoxShadowActive = "#8b0000";
	let canvasPixelBackgroundActive = "#111111";

	/* canvas */
	let canvasBoxShadow = "#000000";
	let canvasBoxShadowError = "#ff0000";
	let canvasBoxShadowActive = "#00ffdd";
	let canvasBoxShadowSuccess = "#55ff00";

	/* overlay */
	let canvasBverlayGradientStart = "transparent";
	let canvasOverlayGradientFinish = "#ffffff";
	let canvasOverlayDecoreArrowLine = "#000000";
	let canvasOverlayDecoreArrowLegend = "#000000";

	/* buttons, inputs, etc. */
	let kToolsBackground = "#dddddd";
	let kToolsForeground = "#000000";
	let kToolsOutline = "#0064c8";
	let kToolsBorder = "#ff0000";
</script>

<body style="--frame-pixel-box-shadow: {framePixelBoxShadow};
				--frame-pixel-background: {framePixelBackground};
				--canvas-pixel-box-shadow: {canvasPixelBoxShadow};
				--canvas-pixel-background: {canvasPixelBackground};
				--canvas-pixel-box-shadow-active: {canvasPixelBoxShadowActive};
				--canvas-pixel-background-active: {canvasPixelBackgroundActive};

				--canvas-box-shadow: {canvasBoxShadow};
				--canvas-box-shadow-error: {canvasBoxShadowError};
				--canvas-box-shadow-active: {canvasBoxShadowActive};
				--canvas-box-shadow-success: {canvasBoxShadowSuccess};

				--canvas-overlay-gradient-start: {canvasBverlayGradientStart};
				--canvas-overlay-gradient-finish: {canvasOverlayGradientFinish};
				--canvas-overlay-decore-arrow-line: {canvasOverlayDecoreArrowLine};
				--canvas-overlay-decore-arrow-legend: {canvasOverlayDecoreArrowLegend};

				--k-tools-background: {kToolsBackground};
				--k-tools-foreground: {kToolsForeground};
				--k-tools-outline: {kToolsOutline};
				--k-tools-border: {kToolsBorder};
				">
	<Canvas></Canvas>
</body>
