/**
 *  Loop
 *  ====
 *
 *  Game loop wrapper for continuous processing.
 */


var RUNNING = false,  // current state of loop

    REF     = null;   // refenrece for the callback

/**
 *  Setup the rendering loop and provide inject the time difference
 *
 *  @param  {Function} render   -
 */

function loop ( render ) {

  if ( RUNNING ) return;

  RUNNING = true;

  REF     = render;

  var time = 0, delta = 0, last = 0;

  requestAnimationFrame( function () { last = win.performance.now(); run(); });

  function run() {

    // workaround: firefox doesn't use performance.now() but Date.now()
    time  = win.performance.now();
    delta = time - last;
    last  = time;

    render( delta ); // throttle( render, delta );

    if ( RUNNING ) requestAnimationFrame( run );
  }
}


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
 *  Stop the loop
 */

loop.stop = function(){

  RUNNING = false;
};


/**
 *  Restart the loop
 */

loop.resume = function(){

  loop(REF);
};


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
