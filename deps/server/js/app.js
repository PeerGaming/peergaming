/**
 *  Brookering Server
 */

var http		= require('http'),
	sse			= require('./transport.sse');
	// ws			= require('./transport.socket');


http.createServer( function ( req, res ) {

	// SSE
	if ( req.headers && req.headers.accept !== 'text/event-stream' && req.method !== 'POST' ) {

		res.writeHead(404);
		res.end();
		return;
	}

	sse.handle( req, res );

	// ws.handle( req, res );

}).listen(2020);
