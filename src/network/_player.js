/**
 *  Player
 *  ======
 *
 *  Interface for the player - will extend the peer wrapper.
 */
// A wrapper for a Peer/Node. Using singleton pattern.

pg.Player = function ( name ) {

	'use strict';

	var Player = (function(){

		// custom settings overwrite default
		utils.extend( config, pg.config );


		var Player = function ( name ) {

			// inherits( this, pg.Peer );

			var data = {

				id		: utils.createUID(), //createID(),
				name	: name
			};

			// this.init( data );
			this.id		= data.id;
			this.name	= data.name;


			// player specific - as private
			this.stores = {};	// current layer= network (e.g. DHT for global)

			this.connections = {};

			// console.log('[Player] id - ' + this.id);
			console.log('\n\t\t:: ' + this.id + ' ::\n');

			var register = function(){

				socket.init( this.id, function ( remoteID ) {

					if ( remoteID ) {

						this.checkNewConnections([ remoteID ]);

					} else {

						// this.stores.global = new DHT( pg.config.dht );
					}

				}.bind(this));

			}.bind(this);

			if ( socketQueue.ready ) {

				register();

			} else {

				socketQueue.add( register );
			}
		};


		Player.prototype.checkNewConnections = function ( list, transport ) {

			var connections = this.connections,
				localID = this.id,
				remoteID;

			for ( var i = 0, l = list.length; i < l; i++ ) {

				remoteID = list[i];

				if ( remoteID !== localID && !connections[ remoteID ] ) {

					instance.connect( remoteID, true, transport );
				}
			}
		};

		// perhaps hide interfaces, include the check new connections into the 'instance.connect' ?
		Player.prototype.connect = function ( remoteID, initiator, transport ) {

			if ( this.connections[remoteID] ) return;	// as connection is force by the user

			// console.log( '[connect] to - "' + remoteID + '"' );

			var connection = new Connection( this.id, remoteID, initiator || false, transport );

			this.connections[ remoteID ] = connection;

			pg.peers[ remoteID ] = new pg.Peer({ id: remoteID, connection: connection });
		};


		Player.prototype.on = utils.on;


		Player.prototype.send = function ( channel, msg ) {

			if ( !msg ) {

				msg = channel;
				channel = null;
			}

			if ( !channel ) channel = [ 'message' ];

			if ( !Array.isArray( channel ) ) channel = [ channel ];

			var connections = this.connections,
				keys = Object.keys( connections ),
				conn, i, l, n, k;

			for ( i = 0, l = keys.length; i < l; i++ ) {

				conn = connections[ keys[i] ];

				for ( n = 0, k = channel.length; n < k; n++ ) {

					conn.send( 'delegate', { action: channel[n], data: msg });
				}
			}
		};


		return Player;

	})();


	return instance || ( instance = new Player( name ) );
};
