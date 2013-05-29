/**
 *  Player
 *  ======
 *
 *  Model for your player - an extension based on a "peer".
 */


/**
 *  Allow the declaration of callbacks before the player gets created
 */

var callbackRefs = {};

pg.player = { on: function ( channel, callback, context ) {

  if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

  callbackRefs[ channel ].push([ callback, context ]);

}};


/**
 *  Constructor to define the basic setup
 *
 *  @param  {Object} account   -
 *  @param  {String} origin    - current path (URL fragment)
 */

var Player = function ( account, origin ) {

  var id    = utils.createUID(),

      data  = getReactor( Manager.update );

  this.time = Date.now();

  this.init( id, account, data );

  if ( Object.keys( callbackRefs ).length ) eventMap[ this.id ] = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  if ( SERVERLESS ) return setImmediate(function(){ Manager.check([ 'SERVERLESS' ]); });


  /** Executes after logout & socket creation **/

  var register = function(){ socket.init( id, origin, Manager.check ); };

  if ( socketQueue.ready ) return register();

  socketQueue.add( register );
};


/**
 *  Player <-- Peer
 */

utils.inherits( Player, Peer );


/**
 *  Change URL to trigger routes for channel or games
 *
 *  @param  {String|Number} channel [description]
 *  @param  {Object}        params  [description]
 */

Player.prototype.join = function ( channel, params ) {

  if ( typeof channel !== 'string' ) channel = channel.toString();

  if ( channel.charAt(0) === '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, utils.createQuery( params ) ].join('');

  if ( path.charAt( path.length - 1 ) !== '/' ) path += '/';

  if ( path === '!/' + SESSION.currentRoute ) return checkRoute();

  win.location.hash = path;
};


/**
 *  Sends a message to a specific peer, a list of peers or even all
 *
 *  @param  {Array}  list   -
 *  @param  {String} msg    -
 */

Player.prototype.send = function ( list, msg ) {

  if ( !msg ) { msg = list; list = null; }

  if ( typeof msg !== 'string' ) msg = msg.toString();

  if ( !list ) list = Object.keys( CONNECTIONS );

  if ( !Array.isArray( list ) ) list = [ list ];

  for ( var i = 0, l = list.length; i < l; i++ ) {

    CONNECTIONS[ list[i] ].send( 'message', { local: this.name, msg: msg });
  }
};


/**
 *  Creates and offers a MediaStream
 *
 *  @param  {String}   id         -
 *  @param  {Object}   config     -
 *  @param  {Function} callback   -
 */

Player.prototype.media = function ( id, config, callback ) {

  // || TODO: 0.5.0 -> mediaStream()
};
