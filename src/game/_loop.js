/**
 *  Loop
 *  ====
 *
 *  Wrapping game loop - sync processing of messages.
 *
 *  Examples:
 *
 *    pg.loop(function ( delta ) { *
 *
 *    });
 *
 *  ## API
 *
 *  .stop
 *  .resume
 */

var RUNNING = false,
    REF     = null;


var loop = function ( render ) {

  if ( RUNNING ) return;

  RUNNING = true;

  REF = render;

  var time  = 0,
      delta = 0,
      last  = 0;

  requestAnimationFrame( function () { last = win.performance.now(); run(); });

  function run() {

    // workaround: firefox doesn't use performance.now() but date.now() :(
    time  = win.performance.now();
    delta = time - last;
    last  = time;

    render( delta ); // throttle( render, delta );

    if ( RUNNING ) requestAnimationFrame( run );
  }

};

// synchronizing delay - using for sync with others | adust the used rate
var LOOP_TIME = DELAY,//16.7,
    DIFF      = 0;

function throttle ( render, delta ) {

  DIFF += delta;

  while ( DIFF >= LOOP_TIME ) {

    DIFF -= LOOP_TIME;

    render( delta );
  }
}


// stop & resumes the loop || ToDo: trigger: pause & unpause
loop.stop    = function(){ RUNNING = false;  };
loop.resume  = function(){ loop(REF);        };


pg.loop = loop;


function checkPause(){

  var title = doc.title.split('[PAUSE]').pop();

  if ( !doc.hidden ) {

    // doc.title = '[PAUSE] - ' + title; //( doc.hidden ? '[PAUSE] ' : '' ) + title;

    loop.stop();

  // ROOM.emit( 'pause', INSTANCE ); // also - sends to all - pause...
  }

}

doc.addEventListener( visibilityChange, checkPause );
