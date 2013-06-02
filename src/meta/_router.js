/**
 *  Router
 *  ======
 *
 *  Matching the browser URL to specific routes for handling rooms (channel or game).
 */



var DEFAULT_ROUTE = 'lobby/',
    LAST_ROUTE    =     null,  // reference to the last route

    channelRoutes =       {},  // collection of the channel routes
    gameRoutes    =       {};  // collection of the game routes


/**
 *  Defines custom routes or changes the default path
 *
 *  @param  {Object} customRoutes   -
 *  @param  {String} defaultRoute   -
 *  @return {Array}
 */

function setRoutes ( customRoutes, defaultRoute ) {

  if ( !defaultRoute && typeof customRoutes === 'string' ) {

    defaultRoute = customRoutes;
    customRoutes = null;
  }

  if ( customRoutes ) defineCustomRoutes( customRoutes );
  if ( defaultRoute ) DEFAULT_ROUTE = defaultRoute;

  return [ channelRoutes, gameRoutes, DEFAULT_ROUTE ];
}


/**
 *  Sanitize the hash URL and provides the path
 *
 *  @return {String}
 */

function getPath(){

  var path = win.location.hash;

  path = ( path.length ) ? path.substr(3) : DEFAULT_ROUTE;

  return ( path.charAt(0) === '/' ) ? path.substr(1) : path;
}



var CHANNEL_PATTERN = /\/(.*?)\//g,
    ARGS_PATTERN    = /(\?)?:\w+/g;

/**
 *  Parsing and setting up custom routes
 *
 *  @param {Object} customRoutes   -
 */

function defineCustomRoutes ( customRoutes ) {

  channelRoutes = {};
  gameRoutes    = {};
}


/**
 *  Extract params and set info
 */

function checkRoute() {

  var path = getPath(),

      args = path.split('/');

  INFO.route = SESSION.route = path;

  if ( args.length < 1 ) return;

  // TODO: 0.7.0 -> customRoutes
  // if ( Object.keys( CUSTOM_PATTERNS ).length ) extractRoute();

  matchRoute( args );
}


function extractRoute(){}         // TODO: 0.7.0 -> custom routes


/**
 *  Retrieve the room handler from the channel/game collections
 *
 *  @param {String} args   -
 */

function matchRoute ( args ) {

  var room = args.shift();

  if ( !room ) {

    win.location.hash = '!/' + DEFAULT_ROUTE;

    return;
  }

  var type = !args[0].length ? 'CHANNEL' : 'GAME';

  ROOM = room = ( type === 'CHANNEL' ) ? CHANNELS[ room ] || CHANNELS[ '*' ]  :
                                         GAMES[ args[0] ] ||    GAMES[ '*' ]  ;

  var params = args; // TODO: 0.7.0 -> parse for custom routes

  if ( LAST_ROUTE === INFO.route ) return;

  if ( room ) {

    if ( LAST_ROUTE  ) {  // change room

      var keys = Object.keys( CONNECTIONS );

      for ( var i = 0, l = keys.length; i < l; i++ ) MANAGER.disconnect( keys[i] );

      SOCKET.send({ action: 'change', data: LAST_ROUTE });
    }

  } else {

    console.warn('[MISSING] ', type ,' handler doesn\'t exist!');
  }

  LAST_ROUTE = INFO.route;
}


/**
 *  Handles history navigation of the browser
 *
 *  @param {Object} e   -
 */

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



/**
 *  Creates a new room (channel or game) and registers handler
 *
 *  @param  {Function} type   -
 *  @return {Function}
 */

function createRoom ( type ) {

  return function ( id, handler ) {

    if ( typeof id !== 'string' ) { handler = id; id = '*'; }

    var room = new type( id ),

        list = ( room instanceof Game ) ? GAMES : CHANNELS;

    list[ id ] = room;

    handler( room );

    return room;
  };
}
