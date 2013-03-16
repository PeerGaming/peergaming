/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */

pg.Peer = (function(){

	'use strict';

	var Peer = function ( data ) {

		this.init( data );
	};

	Peer.prototype.init = function ( data ) {

		this.id			= data.id			|| null;

		this.name		= data.name			|| null;

		this.connection	= data.connection	|| null;
	};

	return Peer;

})();
