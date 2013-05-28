/**
 *  Player
 *  ======
 *
 *  Interface for the player - will extend the peer wrapper.
 *
 *   this: account, data, id
 *  - .join( room, params );
 *  - .message( idList, message ); // or message -> to all connected !
 *  - .media( constraints, callback ) || or just callback
 *
 *
 *  ## Events
 *
 *  - connection
 *  - disconnection
 *
 *  - media ?
 *  - message
 */

// allow declaring callbacks before creation

var callbackRefs = {};

pg.player = { on: function ( channel, callback, context ) {

  if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

  callbackRefs[ channel ].push([ callback, context ]);

}};



var Player = function ( account, origin ) {

  'use strict';

  var id    = utils.createUID(),

      data  = getReactor( Manager.update );

  this.time = Date.now();

  this.init( id, account, data );

  if ( Object.keys( callbackRefs ).length ) eventMap[ this.id ] = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  if ( SERVERLESS ) return setImmediate(function(){ Manager.check([ 'SERVERLESS' ]); });

  var register = function(){ socket.init( id, origin, Manager.check ); };

  if ( socketQueue.ready ) return register();

  socketQueue.add( register );
};


utils.inherits( Player, Peer );


// check if last entry has the same channel - reload page/anchor,
// change URL for router communication
Player.prototype.join = function ( channel, params ) {

  if ( typeof channel !== 'string' ) channel = channel.toString();

  if ( channel.charAt(0) === '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, utils.createQuery( params ) ].join('');

  if ( path.charAt( path.length - 1 ) !== '/' ) path += '/';

  if ( path === '!/' + SESSION.currentRoute ) return checkRoute();

  win.location.hash = path;
};


// idlist -! todo change from channel to IDlist !
Player.prototype.send = function ( list, msg ) {

  if ( !msg ) { msg = list; list = null; }

  if ( typeof msg !== 'string' ) msg = msg.toString();

  if ( !list ) list = Object.keys( CONNECTIONS );

  if ( !Array.isArray( list ) ) list = [ list ];

  for ( var i = 0, l = list.length; i < l; i++ ) {

    CONNECTIONS[ list[i] ].send( 'message', { local: this.name, msg: msg });
  }
};


// offer and creates a media stream
Player.prototype.media = function ( id, config, callback ) {}; // || TODO: 0.5.0 -> mediaStream()
