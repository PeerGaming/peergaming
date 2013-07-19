/**
 *  Loop
 *  ====
 *
 *  Game loop wrapper for continuous processing.
 */


var WAITING = true, // waiting for the initialization = current state of the loop

    RENDER  = null, // refenrece for the callback

    FRAME   = null; // reference to the request Animation frmae...


/**
 *  Provide the rendering function
 *
 *  @param  {Function} render   -
 */

function loop ( render ) {

  if ( !RENDER ) RENDER = render;
}


/**
 *  Invoke the game by starting the loop
 */

function startLoop(){

  // console.log('[LOOP]');

  INGAME = true;

  // cancel on late-join
  loop.stop();

  loop.resume();
}


/**
 *  Stop the loop
 */

loop.stop = function(){

  WAITING = true;

  if ( FRAME ) {

    // console.log('[STOP]');
    cancelAnimationFrame( FRAME );

    FRAME = null;
  }
};


/**
 *  Setup the rendering loop and provide inject the time difference
 *
 *  workaround: firefox doesn't use performance.now() but Date.now()
 */

loop.resume = function(){

  if ( !INGAME || !WAITING ) return;

  WAITING = false;

  // console.log('[RESUME]');

  var time = 0, delta = 0, last = 0, render = RENDER;

  FRAME = requestAnimationFrame( function(){ last = win.performance.now(); run(); });

  function run() {

    time  = win.performance.now();
    delta = time - last;
    last  = time;

    render( delta );
    // throttle( render, delta );

    if ( WAITING ) return;

    FRAME = requestAnimationFrame( run );
  }
};


var LOOP_TIME = DELAY,   // treshhold for fix framerate

    DIFF      = 0;       // tracking the latest time differences

/**
 *  Keep a constant framerate for the rendering
 *
 *  @param  {Function} render   -
 *  @param  {Number}   delta    -
 */

function throttle ( render, delta ) {

  DIFF += delta;

  while ( DIFF >= LOOP_TIME ) {

    DIFF -= LOOP_TIME;

    render( delta );
  }
}


/**
 *  Pauses the game and adjust the title
 *
 *  @param  {Object} e   -
 */

function checkPause ( e ) {

  var title = doc.title.split('[PAUSE]').pop();

  if ( !doc.hidden ) loop.stop();

  doc.title = ( doc.hidden ? '[PAUSE] - ' : '' ) + title;

  //TODO: 0.6.0 -> pause/resume

  // ROOM.emit( 'pause', PLAYER ); // send 'pause' to others as well
}


/** Handler for visibility change **/

doc.addEventListener( visibilityChange, checkPause );
