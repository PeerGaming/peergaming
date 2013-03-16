/**
 *  Brookering Server
 */

var http		= require('http'),
	config		= require('./config.js'),
	sse			= require('./scripts/transport.sse.js');
	ws			= require('./scripts/transport.socket.js');

var server = http.createServer( function ( req, res ) {

	// SSE
	if ( req.headers && req.headers.accept !== 'text/event-stream' && req.method !== 'POST' ) {

		res.writeHead(404);
		res.end();
		return;
	}

	sse.handle( req, res );
});

server.listen( config.port, function(){

	ws.init( server, config.origin );

	console.log( new Date() + ' - Server is listening on port: ' + config.port );
});

