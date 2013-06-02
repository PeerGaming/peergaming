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

PLAYER = {

  on: function ( channel, callback, context ) {

    if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

    callbackRefs[ channel ].push([ callback, context ]);
  }
};


/**
 *  Constructor to define the basic setup
 *
 *  @param  {Object} account   -
 *  @param  {String} origin    - current path (URL fragment)
 */

var Player = function ( account, origin ) {

  var id    = createUID(),

      data  = getReactor( MANAGER.update );

  this.time = Date.now();

  this.init( id, account, data );

  if ( Object.keys( callbackRefs ).length ) eventMap[ this.id ] = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  if ( SERVERLESS ) return setImmediate(function(){ MANAGER.check([ 'SERVERLESS' ]); });


  /** Executes after logout & socket creation **/

  var register = function(){ SOCKET.init( id, origin ); };

  if ( !QUEUE.length ) return register();

  QUEUE.push( register );
};


/**
 *  Player <-- Peer
 */

inherits( Player, Peer );


/**
 *  Formats the input and change the URL to trigger routes for a channel / game
 *
 *  @param  {String|Number} channel [description]
 *  @param  {Object}        params  [description]
 */

Player.prototype.join = function ( channel, params ) {

  if ( typeof channel !== 'string' ) channel = channel.toString();

  if ( channel.charAt(0) === '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, createQuery( params ) ].join('');

  if ( path.charAt( path.length - 1 ) !== '/' ) path += '/';

  // consider hash-cache
  if ( path === '!/' + SESSION.route ) return checkRoute();

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

    CONNECTIONS[ list[i] ].send( 'message', { local: this.name, msg: msg }, true );
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


/**
 *  Creates a secure random user ID
 *  (see: @broofa - http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523 )
 */

function createUID() {

  var pool = new Uint8Array( 1 ),

    random, value,

    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function ( c ) {

      random = crypto.getRandomValues( pool )[0] % 16;

      value = ( c === 'x' ) ? random : (random&0x3|0x8);

      return value.toString(16);
    });

  return id;
}
