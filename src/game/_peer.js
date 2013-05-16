/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */


// Collection of all connected peers
pg.peers = {};

// shortcut to access the stored data
pg.data  = [];

// internal: mapping data-reference to ids
var dataMap = {};


var Peer = function ( data ) {

  this.init( data.id, data.account );
};


// used for: player.on .....
utils.inherits( Peer, Emitter );


Peer.prototype.init = function ( id, account ) {

  Emitter.call( this );

  this.id                     = id;

  this.account                = account;

  if ( !this.data ) this.data = {};

  dataMap[ this.id ]          = pg.data.push( this.data ) - 1;
};


// clears references + triggers callbacks on disconnect
Peer.prototype.remove = function(){

  var id = this.id;

  pg.data.splice( dataMap[id], 1 );

  instance.emit( 'disconnect', this );

  delete pg.peers[ id ];
  delete instance.connections[ id ];
}
