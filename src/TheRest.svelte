<script>
    import Decore from './demo/Graph.svelte'
</script>

<div class="graph-container">

    <div class="decore"><Decore></Decore></div>

    

    
    
</div>

<style>


    .graph-container {
        contain: content;
        width: 1150px;
	    height: 260px;
    }
    
    .graph-axis-y {
        position: fixed;
        top: 0%;
        left: 15px;
        contain: content;
        height: 260px;
        width: 12px;
    }

    .graph-axis-y .arrow-body {
        transform: translateX(-50%);
        background-color: #000000;
        position: absolute;
        height: inherit;
        width: 2px;
        left: 50%;
    }

    .graph-axis-y .arrow-head {
        top: 2px;
        left: 50%;
        width: 10px;
        height: 10px;
        float: right;
        position: absolute;
        border-top: 2px solid #000000;
        border-right: 2px solid #000000;
        transform: translateX(-50%) rotate(-45deg);
    }

    .graph-axis-x {
        position: fixed;
        top: 90%;
        contain: content;
        width: 1110px;
        height: 12px;
    }

    .graph-axis-x .arrow-body {
        transform: translateY(-50%);
        background-color: #000000;
        position: absolute;
        width: inherit;
        height: 2px;
        top: 50%;
    }

    .graph-axis-x .arrow-head {
        top: 50%;
        right: 2px;
        width: 10px;
        height: 10px;
        float: right;
        position: absolute;
        border-top: 2px solid #000000;
        border-right: 2px solid #000000;
        transform: translateY(-50%) rotate(45deg);
    }

    .chart {
        border-left: 2px solid black;
        border-bottom: 2px solid black;
        width: 1120px;
        height: 230px;
    }

    .decor {
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f4f4f4;
        width: 1120px;
        height: 210px;
        margin-bottom: 20px;
        margin-left: 20px;
    }
</style>
