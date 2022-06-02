<div class="vertical flip-container" ontouchstart="this.classList.toggle('hover');">
    <div class="flipper">
        <div class="front">
            Front Side
        </div>
        <div class="back">
            Back Side
        </div>
    </div>
</div>

<style>
    /* entire container, keeps perspective */
    .flip-container {
        perspective: 1000px;
    }

    .flip-container, .front, .back {
        width: 320px;
        height: 480px;
    }

    /* flip speed goes here */
    .flipper {
        transition: 0.6s;
        transform-style: preserve-3d;
        position: relative;
    }

    /* hide back of pane during swap */
    .front, .back {
        position: absolute;
        top: 0;
        left: 0;
        backface-visibility:hidden;
        -webkit-backface-visibility:hidden;
    }

    /* front pane, placed above back */
    .front {
        z-index: 1;
        background-color:red;
    }

    /* back, initially hidden pane */
    .back {
        transform: rotateX(-180deg);
        background-color:green; 
        animation: toFront 0.3s linear normal forwards;
    }
    .vertical.flip-container {
        position: relative;
    }
    .vertical.flip-container:hover .back {
        animation-delay: 0.3s;
        animation: toBack 0.3s linear normal  forwards;
    }
    @keyframes toBack {  
    0% {z-index:0;}
    100% {z-index:1;}
    }
    @keyframes toFront {
    0% {z-index:1;}
    100% {z-index:0;}
    }
    .vertical.flip-container .flipper {
        transform-origin: 100% 240px; /* half of height */
    }

    .vertical.flip-container:hover .flipper {
        transform: rotateX(-180deg);
    }
</style>