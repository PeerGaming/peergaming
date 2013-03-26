/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */

var Peer = (function(){

	'use strict';

	var Peer = function ( data ) {

		this.init( data );
	};


	utils.inherits( Peer, Emitter );


	Peer.prototype.init = function ( data ) {

		Emitter.call( this );

		this.id			= data.id			|| null;

		this.name		= data.name			|| null;
	};


	return Peer;

})();
