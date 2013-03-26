/**
 *  Default
 *  =======
 *
 *  Default Handler for common task (e.g. estbalish mesh network).
 *  Context will be the on of the connection ? or like before from the handler ?
 */

// custom handler collection

// var customHandlers = {};
// customHandlers[ label ] ||

var defaultHandlers = {

	init: {

		open: function() {

			// channel established && open
			delete this.info.pending;

			this.send( 'init', {

				name: instance.name,

				list: Object.keys( instance.connections )
			});
		},

		end: function ( msg ) {

			var data = JSON.parse( msg ),

				peer = pg.peers[ this.info.remote ];

			utils.extend( peer, { name: data.name });

			instance.emit( 'connection', peer );

			// ToDo: refactor with .connect()
			instance.checkNewConnections( data.list, this );
			// providing transport - register delegation
		},

		close: function ( msg ) {

			console.log('[closed]');

			console.log(msg);
		}

	},


	register: function ( msg ) {

		var data = JSON.parse( msg );

		if ( data.remote !== instance.id ) {	// proxy

			// just handler between - setting up for remote delegation
			// console.log( '[proxy] ' + data.local + ' -> ' + data.remote );
			instance.connections[ data.remote ].send( 'register', data );

		} else {

			if ( !instance.connections[ data.local ] ) {

				instance.connect( data.local, false, this );
			}

			instance.connections[ data.local ][ data.action ]( data.data );
		}
	},


	custom: function ( msg ) {

		console.log('[channel doesn\'t exist yet - local delegation');

		var data = JSON.parse( msg );

		console.log(data.action);

	},


	message: function ( msg ) {

		instance.emit( 'message', msg );
	}

};

