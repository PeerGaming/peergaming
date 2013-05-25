/**
 *  Login
 *  =====
 *
 *  can be used after handling authentication - wrapper to preset the Peer !
 *
 *  Can either be a string, which is then just a name, no external service will be used - or an
 *  secondary parameter with further credentials.
 *
 *  e.g.: 'name' or 'name', 'service'
 *
 *  // callback of "next" is also optional, as it wouldn't be required ||
 *   if it exists - will be called before the default join  ||
 *
 *
 *      additional hook can m
 *
 *  optional: hook && service (required just name etc.) ||
 */


pg.login = function ( name, service, hook ) {

  if ( typeof service === 'function' ) { hook = service; service = null; }

  if ( service ) return requestOAuth( name, service, hook );

  var account = { name: name };

  createPlayer( account, hook );
};


// allow to login and use 3rd party data
function requestOAuth ( name, service, hook ) {

  // using the socket to request credentials

  var account = { name: name };

  createPlayer( account, hook );
}


// assign value
function createPlayer ( account, hook ) {

  var origin = win.location.hash.substr(3) || DEFAULT_ROUTE.substr(1);

  pg.player = INSTANCE = new Player( account, origin );

  if ( hook ) hook( INSTANCE );

  INSTANCE.join( origin );
}
