/**
 *  Loop
 *  ====
 *
 *  Wrapping game loop - sync processing of messages.
 *
 *  Examples:
 *
 *    pg.loop(function ( delta ) {
 *
 *
 *    });
 */


pg.loop = (function(){


  var loop = function ( next ) {

    delta = 100;

    while ( delta >= LOOP_TIME ) {

      delta -= LOOP_TIME;

      // render()
    }


    // next( );
    requestAnimationFame( loop );
  };

  return loop;

})();


// requestAniation frame


// pause:

// on disconnect, offline
// on visibility hidden (trigger pause)




// sync time -? will be define in the inital connection , just for testing 0 or 1 || can be updated
// internally.....

// see property. get passed time since started, request.animatin frame

// function loop ( render ) {

//      delta time

//      while ( >= SYNC_DELAY ) {
//
//          delta -= SYNC_DELAY;
//
//          render();
//      }



//     render();
//     requestAnimationFame( loop );
// }


// loop(function(){

//     // .update()
//     // .draw()
// });




// as a channel will be called - creating one - coomunicate with others to join ?
// pg.routes( createChannel, createGame ); //




// visibility change etc. as well


// // pause... resume

// // We simply subscribe to the offline or online event and pass a function (or function reference)
// // invoke our handler when the offline event occurs
// window.addEventListener("offline", whoopsWeAreOffline);
// // and when the online event occurs....
// window.addEventListener("online", sweetBackOnLine);



// if (navigator.onLine) {
//     sweetWeAreKindaMaybeOnline();
// } else {
//     uhOhWeAreProbablyButNotDefinitelyOffline();
// }
