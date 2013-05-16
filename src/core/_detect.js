/**
 *  Detect
 *  ======
 *
 *  Checks if the required features or status is supported by the browser.
 *
 *  ToDo:
 *
 *  - DataChannel
 *  - ServerSent Events/WebSocket
 */


var reliable  = false,

    features  = [ 'URL', 'Blob', 'crypto', 'indexedDB', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

  if ( !(features[i] in win ) ) console.log( 'Missing: ', features[i] );
}

if ( !win.RTCPeerConnection ) throw new Error('Your browser doesn\'t support PeerConnections yet.');


var littleEndian = (function(){

    var arr32   = new Uint32Array(1),
        arr8    = new Uint8Array( arr32.buffer );

    arr32[0] = 255;

    return !!arr8[0];   // 255 0 0 - litte  ||  0 0 255 - big
})();
