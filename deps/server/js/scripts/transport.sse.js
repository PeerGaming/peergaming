/**
 *  Transport - ServerSentEvents
 *  ============================
 *
 *  Transport Layer for SSE
 */


var peerlist  = require('./peerlist');


var handle = function ( req, res ) {

  if ( req.headers.accept === 'text/event-stream' ) {

    establishStream( req, res );

  } else if ( req.method === 'POST' ) {

    parseMessage( req, res );
  }
};


function establishStream ( req, res ) {

  res.writeHead( 200, {

    'Content-Type'               : 'text/event-stream',
    'Cache-Control'              : 'no-cache',
    'Connection'                 : 'keep-alive',

    'Access-Control-Allow-Origin': '*'  // CORS handling
  });

  var id = req.url.substr(1);

  peerlist.init( id, res );
}


function parseMessage ( req, res ) {

  var msg = '';

  req .on('data', function ( chunk ) { msg += chunk; })
      .on('end',  function(){

        res.writeHead( 200, { 'Access-Control-Allow-Origin' : '*' });
        msg = JSON.parse(msg);

        peerlist.handle( msg, res );
      });
}

module.exports = { handle: handle };
