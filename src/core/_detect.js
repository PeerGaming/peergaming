/**
 *  Detect
 *  ======
 *
 *  Checks if the required features or status is supported by the browser.
 */


var features  = [ 'URL', 'Blob', 'crypto', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

  if ( !(features[i] in win) ) throw new Error( '[MISSING FEATURE] ' + features[i] );
}

if ( !win.RTCPeerConnection ) return alert('Your browser doesn\'t support PeerConnections yet.');


/**
 *  Returns the endianess of the system
 *
 *  @return {Boolean}
 */

var littleEndian = (function(){

    var arr32   = new Uint32Array(1),
        arr8    = new Uint8Array( arr32.buffer );

    arr32[0] = 255;

    return !!arr8[0]; // 255 0 0 - litte  ||  0 0 255 - big
})();
