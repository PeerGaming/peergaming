/**
 *  Transport - Socket
 *  ==================
 *
 *  WebSocket Transport Layer
 */

var querystring     = require('querystring'),
    WebSocketServer	= require('websocket').server,
    peerlist        = require('./peerlist.js');


var init = function ( server, origin ) {

	var socketServer = new WebSocketServer({

    httpServer            : server,
    autoAcceptConnections : false
  });


	socketServer.on('request', function ( req ) {

    // prevent CORS
		if ( origin && req.origin !== origin ) { req.reject(); return; }

    var query       = querystring.parse( req.httpRequest.url.substr(2) ),
        connection  = req.accept( null, req.origin );

		handle( query, connection );
	});


	function handle ( query, connection ) {

		peerlist.init( query, connection );

		connection.on('message', function ( msg ) {

			if ( msg.type === 'utf8' ) {

				msg = JSON.parse( msg.utf8Data );

				peerlist.handle( msg );
			}
		});


		connection.on('error', function ( e ) {

			console.log( '[error] - ' + e );
		});


		connection.on('close', function() {

			// console.log('[close]');
			peerlist.handle({ action: 'remove', origin: query.origin, local: query.local });
		});

	}
};


module.exports = { init: init };
