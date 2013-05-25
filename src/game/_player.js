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
 */

// allow declaring callbacks before creation

var callbackRefs = {};

pg.player = { on: function ( channel, callback, context ) {

  if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

  callbackRefs[ channel ].push([ callback, context ]);

}};


// player

var Player = function ( account, origin ) {

  'use strict';

  var id = utils.createUID();

  this.data = getReactor( Manager.update );

  this.init( id, account );

  if ( Object.keys( callbackRefs ).length ) eventMap[ this.id ] = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  var register = function(){ socket.init( id, origin, Manager.check ); };

  if ( socketQueue.ready ) return register();

  socketQueue.add( register );
};


utils.inherits( Player, Peer );

// check if last entry has the same channel - reload page/anchor, change URL for router communication
Player.prototype.join = function ( channel, params ) {

  if ( channel.charAt(0) === '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, utils.createQuery( params ) ].join('');

  if ( path.charAt( path.length - 1 ) !== '/' ) path += '/';

  if ( path === '!/' + SESSION.currentRoute ) return checkRoute();

  win.location.hash = path;
};


Player.prototype.message = function ( channel, msg ) {

  if ( !msg ) { msg = channel; channel = null; }

  if ( !channel ) channel = [ 'message' ];

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  var keys = Object.keys( CONNECTIONS ),
      conn, i, l, n, k;

  for ( i = 0, l = keys.length; i < l; i++ ) {

    conn = CONNECTIONS[ keys[i] ];

    for ( n = 0, k = channel.length; n < k; n++ ) {

      conn.send( channel, { local: this.name, msg: msg });
    }
  }

};


// offer and creates a media stream
Player.prototype.media = function ( id, config, callback ) {


};
