/**
 *  Peer
 *  ====
 *
 *  Model for a "peer" - a representation of an other player.
 */


/**
 *  Constructor to diverge the intial parameters
 *
 *  @param  {Object} data   -
 */

var Peer = function ( params ) {

  this.init( params.id, params.account || {}, params.data || {} );
};


/**
 *  Assign properties for basic the structure
 *
 *  @param  {String} id        -
 *  @param  {Object} account   -
 *  @param  {Object} data      -
 */

Peer.prototype.init = function ( id, account, data ) {

  this.id      = id;

  this.account = account;

  this.data    = data;

  this.pos     = DATA.push( this.data ) - 1;

  Emitter.call( this, id );
};
