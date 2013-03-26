/**
 *  Player
 *  ======
 *
 *  Interface for the player - will extend the peer wrapper.
 *  // A wrapper for a Peer/Node. Using singleton pattern.
 */


pg.Player = function ( name ) {

	'use strict';

	var Player = (function(){


		var Player = function ( name ) {

			var data = {

				id		: utils.createUID(),
				name	: name
			};

			this.init( data );

			this.connections = {};


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


		utils.inherits( Player, Peer );


		Player.prototype.checkNewConnections = function ( list, transport ) {

			var connections = this.connections,
				localID = this.id,
				remoteID;

			for ( var i = 0, l = list.length; i < l; i++ ) {

				remoteID = list[i];

				if ( remoteID !== localID && !connections[ remoteID ] ) {

					this.connect( remoteID, true, transport );
				}
			}
		};


		// perhaps hide interfaces, include the check new connections into the 'instance.connect' ?
		Player.prototype.connect = function ( remoteID, initiator, transport ) {

			if ( this.connections[remoteID] ) return;	// as connection is force by the user

			// console.log( '[connect] to - "' + remoteID + '"' );

			var connection = new Connection( this.id, remoteID, initiator || false, transport );

			this.connections[ remoteID ] = connection;

			pg.peers[ remoteID ] = new Peer({ id: remoteID, connection: connection });
		};


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

					conn.send( channel, { local: this.name, msg: msg });
				}
			}
		};

		return Player;

	})();


	return instance || ( instance = new Player( name ) );
};

