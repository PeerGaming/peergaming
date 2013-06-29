/**
 *  Login
 *  =====
 *
 *  Entry for creating a player or use a service for additional data.
 */


/**
 *  Uses a plain text name or request more information via authentication
 *
 *  @param  {String}   name      -
 *  @param  {String}   service   -
 *  @param  {Function} hook      -
 */

function login ( name, service, hook ) {

  if ( PLAYER.id ) return PLAYER;

  if ( typeof service === 'function' ) { hook = service; service = null; }

  if ( service ) return requestOAuth( name, service, hook );

  var account = { name: name };

  createPlayer( account, hook );
}


/**
 *  Check if the selected service is supported and handles response
 *
 *  @param  {String}   name      -
 *  @param  {String}   service   -
 *  @param  {Function} hook      -
 */

function requestOAuth ( name, service, hook ) {

  service = service.toUpperCase();

  if ( !AUTH[ service ] ) return console.log('[ERROR] The chosen service is not supported yet.');

  // AUTH[ service ]( name , function ( account ) {

  var account = { name: name };

  createPlayer( account, hook );
  // });
}


/**
 *  Creates the player and extracts the initial route
 *
 *  @param {Object}   account   -
 *  @param {Function} hook      -
 */

function createPlayer ( account, hook ) {

  var origin = getPath();

  pg.player  = PLAYER = new Player( account, origin );

  if ( hook ) hook( PLAYER );

  PLAYER.join( origin );
}
