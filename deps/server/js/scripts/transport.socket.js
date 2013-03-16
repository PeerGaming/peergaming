var WebSocketServer	= require('websocket').server,
	peerlist		= require('./peerlist.js');


var init = function ( server, origin ) {


	var socketServer = new WebSocketServer({

		httpServer: server,
		autoAcceptConnections: false
	});


	socketServer.on('request', function ( req ) {

		if ( req.origin !== origin ) {	// prevent CORS

			req.reject();
			return;
		}

		var connection	= req.accept( null, req.origin ),
			id			= req.httpRequest.url.substr(1);

		handle( id, connection );
	});


	function handle ( id, connection ) {


		peerlist.init( id, connection );


		connection.on('message', function ( msg ) {

			if ( msg.type === 'utf8' ) {

				msg = JSON.parse( msg.utf8Data );

				peerlist.handle( msg );
			}
		});


		connection.on('error', function ( e )  {

			console.log( '[error] - ' + e );
		});


		connection.on('close', function() {

			// console.log('[close]');

			var msg = { action: 'remove', data: id };

			peerlist.handle( msg );
		});
	}
};


module.exports = { init: init };
