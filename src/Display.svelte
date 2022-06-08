<script context="module">
    import Viewport from 'svelte-viewport-info'
  </script>
  
  <script>
    console.log('Viewport Width x Height:     ',Viewport.Width+'x'+Viewport.Height)
    console.log('standard Screen Orientation: ',Viewport.Orientation)
    console.log('detailled Screen Orientation:',Viewport.detailledOrientation)
  </script>
  
  <svelte:body
    on:viewportchanged={() => {
      console.log('Viewport Size changed to: ',Viewport.Width+'x'+Viewport.Height)
    }}
    on:orientationchangeend={() => { console.log(
      'Screen Orientation changed to: ', Viewport.Orientation + (
        Viewport.detailledOrientation == null
        ? ''
        : '(' + Viewport.detailledOrientation + ')'
      )
    ) }}
  />
  
  <p style="line-height:150%">
    Open the console (shown below) to see the output of this example.
  </p>
  
  <p style="line-height:150%">
    On notebooks and desktops you may then resize the browser window, and on mobile
    devices you may change their orientation while still watching the console for
    changes.
  </p>
  

  function handleCanvasTouchStart(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        /*ongoingTouches.push(copyTouch(touches[i]));
        touchPaint(touches[i].target);
        console.log(touches[i]);*/
        touchPaint(touches[i].pageX, touches[i].pageY);
        //ongoingTouches.push(copyTouch(touches[i]));
    }
    
    isTouchDown = true;
}

function handleCanvasTouchMove(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        touchPaint(touches[i].pageX, touches[i].pageY);
        /*
        //const idx = ongoingTouchIndexById(touches[i].identifier);
        
        if (idx >= 0) {
            //log(`continuing touch ${ idx }`);
            //console.log(ongoingTouches[idx]);
            /*touchPaint(ongoingTouches[idx].target);
            console.log('ongoingTouches[idx] pageX: ' + ongoingTouches[idx].pageX + ' pageY: ' + ongoingTouches[idx].pageY);
            console.log('ongoingTouches[idx] col: ' + ongoingTouches[idx].target.getAttribute('data-col') + ' pix: ' + ongoingTouches[idx].target.getAttribute('data-pix'));
            
            touchPaint(touches[i].target);
            console.log('touches[i] pageX: ' + touches[i].pageX + ' pageY: ' + touches[i].pageY);
            console.log('touches[i] col: ' + touches[i].target.getAttribute('data-col') + ' pix: ' + touches[i].target.getAttribute('data-pix'));
            *///ctx.moveTo(,);

            //touchPaint(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
            //touchPaint(touches[i].pageX, touches[i].pageY);
            
            

            /* swap in the new touch record 
            ongoingTouches.splice(idx, 1, copyTouch(touches[i]));
        } else {
            //log('can\'t figure out which touch to continue');
        }*/
    }
}