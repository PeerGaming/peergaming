/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */


pg.peers      = {}; // Collection of all connected peers

pg.data       = []; // shortcut to access the stored data


var Peer = function ( data ) {

  this.init( data.id, data.account );
};


// used for: player.on .....
utils.inherits( Peer, Emitter );


Peer.prototype.init = function ( id, account ) {

  this.id                     = id;

  this.account                = account;

  if ( !this.data ) this.data = {};

  this.pos                    = pg.data.push( this.data ) - 1;

  Emitter.call( this, id );
};
