/**
 *  Routes
 *  ======
 *
 *  Matching request/URL routes.
 *
 *  allows to define customRoutes & default (which will be called in initalization !)
 *
 * // setting up routes - optional setting, can provide a dictionary for custom routes + default route
 *  ToDo:
 *
 *  - add History API support (see server side support)
 *
 *  - improve param splitting + channel / game recognition
 *
 *
 *  as of v2 using functions, easier as mostly the application itself will just need on hook,
 *  and not multiple (see demonstration, || there can be different routes, but else simpler !)
 *
 *  Example:
 *
 *    pg.routes(
 *
 *      // channel,
 *
 *      // game
 *    ) // 2 simple - or one objct for cunfiguraiton !
 *
 *		pg.routes({
 *
 *
 *		})
 */


var channelRoutes   = {},               // collection of the channel routes
    gameRoutes      = {},               // collection of the game  routes
    LAST_ROUTE      = null,
    DEFAULT_ROUTE   = '/lobby/';


pg.routes = function ( customRoutes, defaultRoute ) {

  if ( !defaultRoute && typeof customRoutes === 'string' ) { // less then 2 arguments

    defaultRoute = customRoutes;
    customRoutes = null;
  }

  if ( customRoutes ) defineCustomRoutes( customRoutes );
  if ( defaultRoute ) DEFAULT_ROUTE = defaultRoute;

  return [ channelRoutes, gameRoutes, DEFAULT_ROUTE ];
};


// var CHANNEL_PATTERN = /\/(.*?)\//g,
//     ARGS_PATTERN    = /(\?)?:\w+/g;

function defineCustomRoutes ( customRoutes ) {

  channelRoutes = {};
  gameRoutes = {};
}


// extract params
function checkRoute() {

  var path    = win.location.hash.substr(3),
      args    = path.split('/');

  INFO.route = SESSION.currentRoute = path;

  if ( args.length < 1 ) return;

  // if ( Object.keys( CUSTOM_PATTERNS ).length ) extractRoute(); // TODO: 0.7.0 -> customRoutes

  matchRoute( args );
}


// execute wrapped function, cann be a channel or game
function matchRoute ( args ) {

  var room = args.shift();

  if ( !room ) { // re-routing

    win.location.hash = '!/' + DEFAULT_ROUTE.substr(1);

    return;
  }

  // var lastRoom = ROOM; // behavior ?

  // room match -> arguments
  ROOM = room = !args[0].length ? CHANNELS[ room ] || CHANNELS[ '*' ]  :
                                     GAMES[ room ] ||    GAMES[ '*' ]  ;


  // TODO: parse for custom routes
  var params = args;

  // prevent re-join the current room...
  if ( LAST_ROUTE === INFO.route ) return;


  if ( room ) {

    // if ( lastRoom ) lastRoom.emit( 'leave', INSTANCE );

    // initial setup - attach handler
    // room.emit( 'enter', INSTANCE, params ); // even without other peer ?
    //  // better setup loading/waiting hook !

    if ( LAST_ROUTE  ) {

      var keys = Object.keys( CONNECTIONS );

      for ( var i = 0, l = keys.length; i < l; i++ ) Manager.disconnect( keys[i] );

      socket.send({ action: 'change', data: LAST_ROUTE });
    }

    LAST_ROUTE = INFO.route;

  } else {

    throw new Error('Missing channel/game handler !');
  }
}


// customRoute with specifc params
// function extractRoute() {

//   console.log('[ToDo] Extract Params');
// }


function leaveSite ( e ) {

  // prevent initial triggering
  if ( chrome ) { chrome = !chrome; return; }

  // if ( !history.state ) {
  //  console.log(LAST_ROUTE);
  //  return window.history.back();
  // }
}

/** attach listener **/
win.addEventListener( 'hashchange', checkRoute ); // join
win.addEventListener( 'popstate',   leaveSite  ); // history navigation
