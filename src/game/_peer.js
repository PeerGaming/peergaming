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
var dataMap   = {};

var Peer = function ( data ) {

  this.init( data.id, data.account );
};


// used for: player.on .....
utils.inherits( Peer, Emitter );


Peer.prototype.init = function ( id, account ) {

  Emitter.call( this, id );

  this.id                     = id;

  this.account                = account;

  if ( !this.data ) this.data = {};

  dataMap[ this.id ]          = pg.data.push( this.data ) - 1;
};
