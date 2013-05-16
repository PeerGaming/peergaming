/**
 *  Routes
 *  ======
 *
 *  Matching request/URL routes.
 *
 *
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


// using the speeration of the channels, games ?s


var channelRoutes   = {},               // collection of the channel routes
    gameRoutes      = {},               // collection of the game  routes

    // CUSTOM_PATTERNS = null,             // custom Patterns (which are used for the customRoutes)

    // DEFAULT_CHANNEL = '/:channel/',
    // DEFAULT_GAME    = '/:game/:id/',
    DEFAULT_ROUTE   = '/lobby/';




// setting up routes

// optional setting, can provide a dictionary for custom routes + default route

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

// TODO
function defineCustomRoutes ( customRoutes ) {

  channelRoutes = {};
  gameRoutes = {};
}




// parsing routing behavior


// extract params
function checkRoute() {

  var path    = win.location.hash.substr(3),
      args    = path.split('/');

  SESSION.currentRoute = path;

  if ( args.length < 1 ) return;

  // if ( Object.keys( CUSTOM_PATTERNS ).length ) extractRoute();

  matchRoute( args );
}


// execute wrapped function
// cann be a channel or game
function matchRoute ( args ) {

  var room = args.shift();

  if ( !room ) { // re-routing

    win.location.hash = '!/' + DEFAULT_ROUTE.substr(1);

    return;
  }

  // room match -> arguments, defined as a channel or game
  var match = !args[0].length ? channels[ room ] || channels[ '*' ]  :
                                   games[ room ] ||    games[ '*' ]  ;


  // TODO: parsed by custom routes
  var params = args;

  if ( match ) {

    match.call( match, params );

  } else {

    throw new Error('Missing channel/game handler !');
  }
}


// customRoute with specifc params
// function extractRoute() {

//   console.log('[ToDo] Extract Params');
// }


// attach listener
win.addEventListener( 'hashchange', checkRoute );
