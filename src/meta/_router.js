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

  INFO.room = SESSION.currentRoute = path;

  if ( args.length < 1 ) return;

  // if ( Object.keys( CUSTOM_PATTERNS ).length ) extractRoute();

  matchRoute( args );
}


// execute wrapped function, cann be a channel or game
function matchRoute ( args ) {

  var room = args.shift();

  if ( !room ) { // re-routing

    win.location.hash = '!/' + DEFAULT_ROUTE.substr(1);

    return;
  }

  // room match -> arguments, defined as a channel or game
  var match = !args[0].length ? channels[ room ] || channels[ '*' ]  :
                                   games[ room ] ||    games[ '*' ]  ;

  // TODO: parse for custom routes
  var params = args;

  // prevent re-join the current room...
  if ( LAST_ROUTE === INFO.room ) return;

  if ( match ) {

    match.call( match, params );

    if ( LAST_ROUTE  ) {

      // TODO: close all peerconnections else ! (see manager)
      socket.send({ action: 'change', data: LAST_ROUTE });
    }

    LAST_ROUTE = INFO.room;

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
  // console.log(LAST_ROUTE);

  // return window.history.back();
  // }
}

/** attach listener **/
win.addEventListener( 'hashchange', checkRoute ); // join
win.addEventListener( 'popstate', leaveSite );    // history navigation
