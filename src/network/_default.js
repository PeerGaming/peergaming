/**
 *  Default
 *  =======
 *
 *  Default Handler for common task (e.g. estbalish mesh network).
 *  Context will be the on of the connection ? or like before from the handler ?
 */

// will be delegated throuhg / custom - in an 1:1 (2player - otherwise created via dsitribution etc.)

var customHandlers = {

	message: function ( msg, e ) {

		// console.log('message');

		console.log(msg);
	}
};


// buffer will be reused - Date.now() is ist as a simple key !
var buffer = {};


// socket.handle wird aufgesplitted -- // register can also then be attached to the socket !
var defaultHandlers = {

	// getInfos
	init: {

		open: function(){
			// console.log('[init - open]');
			// ToDo: receive remote information - can also be called by user to update etc.
			// this.getPeerInfo();			\\ or perhaps later on> shifting towards the player !
			// var data = instance.getInfo()

			var data = { name: instance.name, list: Object.keys(instance.connections)  };

			this.send('init', data );
		},

		message: function ( e ) {

			var msg = JSON.parse( e.data ),

				peer = pg.peers[ this.remoteID ];

			utils.extend( peer, { name: msg.name });

			instance.checkNewConnections( msg.list, this );

			utils.emit('connection', peer );
		}
	},


	chunk: function ( e ) {		// responding to itself...

		var msg		= JSON.parse( e.data ),
			channel	= this.channels['chunk'],
			id		= msg.id,
			part,
			timer;


		// na~ive		|| non reliable channels...

		if ( !msg.data && !msg.size ) {					// sending chunk

			// console.log('[send chunk] - || ' + buffer[id].length );

			setTimeout(function(){

				channel.send( JSON.stringify({ id: id, data: buffer[id].pop() }) );

			}, config.channelConfig.CHUNK_DELAY );


			return;
		}


		if ( !buffer[id] ) {								// first declaration || new chunks

			// console.log( '[new chunk] - || ' + msg.size );

			buffer[id] = { size: msg.size, chunks: [] };

			part = buffer[id].chunks.length;

			// console.log('[request chunk] - || ' + part );

			channel.send( JSON.stringify({ id: id, part: part }) );

			return;
		}


		buffer[id].chunks.push( msg.data );


		// request
		if ( buffer[id].chunks.length !== buffer[id].size ) {

			part = buffer[id].chunks.length;

			// console.log('[request chunk] - || ' + part );

			channel.send( JSON.stringify({ id: id, part: part }) );

		// build
		} else {

			// console.log('[build chunk]');
			// console.log(buffer[id].chunks);

			msg = buffer[id].chunks.join('');

			msg = JSON.parse(  msg );

			delete buffer[id];

			// console.log(msg);

			if ( customHandlers[msg.action] ) {

				customHandlers[msg.action]( msg.data );

			} else {

				defaultHandlers.register({ data: JSON.stringify(msg) });
			}
		}
	},


	register: function ( e ) {

		var msg = JSON.parse( e.data );

		if ( instance.connections[ msg.remote ] ) {	// proxy

			// just handler between - setting up for remote delegation
			// console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

			instance.connections[ msg.remote ].send( 'register', msg );

		} else if ( msg.remote === instance.id ) {	// gets the answers in return as well !

			// console.log(msg);

			if ( !instance.connections[ msg.local ] ) {

				instance.connect( msg.local, false, this );
			}

			instance.connections[ msg.local ][ msg.action ]( msg.data );
		}
	},


	delegate: function ( e ) {

		// console.log('[channel doesn\'t exist yet - local delegation');

		var msg = JSON.parse(e.data);
		// console.log(msg);

		if ( customHandlers[ msg.action ] ) {

			customHandlers[ msg.action ]( msg.data, e );
		}
	}
};

