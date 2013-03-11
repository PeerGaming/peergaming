/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */

pg.Peer = function ( name ) {

	'use strict';

	var Peer = (function(){


		var Peer = function ( name ) {

			// if ( options ) {

			//	extend( pg.config, options );
			// }

			this.name = name;

			this.id = createId( name );

			this.stores = {};			// DHT Storage - global level

			this.connections = {};


			var register = function(){

				transport.init(	this.id, function ( remoteID ) { // .then()

					if ( remoteID ) {

						this.connect( remoteID );

					} else {

						// this.stores.global = new DHT( pg.config.dht );
					}

				}.bind(this));

			}.bind(this);


			if ( ready ) {

				register();

			} else {

				pg.queue.push( register );
			}
		};


		Peer.prototype.connect = function ( remoteID, input ) {

			if ( this.connections[remoteID] ) return;

			console.log( 'connect to "' + remoteID + '"' );

			this.connections[ remoteID ] = new Connection( this.id, remoteID, input );
		};


		// Peer.prototype.on = pg.on;


		// ToDo: Use a timestemp for ID calculation  ?
		function createId ( name ) {

			var id = name;
			// var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			//	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			//	return v.toString(16);
			// });

			return id;
		}

		return Peer;

	})();



	return instance || ( instance = new Peer( name ) );
};
