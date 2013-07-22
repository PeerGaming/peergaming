/**
 *  Adapter
 *  =======
 *
 *  Normalize different browser behavior - using prefixes and workarounds.
 *
 *  Based on Adapter.js - r4281
 *  (https://code.google.com/p/webrtc/source/browse/trunk/samples/js/base/adapter.js)
 */


/** Performance **/

if ( !win.performance ) {

  win.performance = { now: Date().now() };

} else if ( !win.performance.now ) {

  win.performance.now = win.performance.webkitNow;
}


/** requestAnimationFrame **/

if ( !win.requestAnimationFrame ) {

  var vendors = [ 'webkit', 'moz' ];

  for ( var i = 0, l = vendors.length; i < l && !win.requestAnimationFrame; i++ ) {

    win.requestAnimationFrame = win[ vendors[i] + 'RequestAnimationFrame' ];
    win.cancelAnimationFrame  = win[ vendors[i] + 'CancelAnimationFrame' ]        ||
                                win[ vendors[i] + 'CancelRequestAnimationFrame' ];
  }
}


/** visibility **/

var visibilityChange;

if ( !( 'hidden' in doc ) ) {

  var vendors = [ 'webkit', 'moz', 'ms', 'o' ];

  if ( doc.state ) vendors.length = 0;

  for ( var i = 0, l = vendors.length; i < l; i++ ) {

    if ( (vendors[i]+'Hidden') in doc ) {

      doc.state         = doc[ vendors[i] + 'VisibilityState' ];
      doc.hidden        = doc[ vendors[i] + 'Hidden'          ];
      visibilityChange  =      vendors[i] + 'visibilitychange' ;
    }
  }

  if ( !visibilityChange ) visibilityChange = 'visibilitychange';
  // var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
  // document.addEventListener(evtname, visChange);
}


/** Blob & ObjectURL **/

if ( !win.URL ) {

  win.URL = win.webkitURL || win.msURL || win.oURL;
}

if ( !win.Blob && !win.BlobBuilder ) {

  win.BlobBuilder = win.BlobBuilder       ||
                    win.WebKitBlobBuilder ||
                    win.MozBlobBuilder    ||
                    win.MSBlobBuilder     ||
                    win.OBlobBuilder;
}


/** setImmediate **/

if ( !win.setImmediate ) {

  win.setImmediate = (function () {

    var callbacks = [];

    win.addEventListener( 'message', handle, true );

    function handle ( e ) { if ( e.data === 'setImmediate' ) callbacks.shift()(); }

    return function ( fn ) {

      if ( typeof fn !== 'function' ) throw Error('Invalid Argument');

      callbacks.push( fn );

      win.postMessage( 'setImmediate', win.location.href );
    };

  })();
}


/** MediaStream **/

if ( !nav.getUserMedia ) {

  nav.getUserMedia =  ( nav.mozGetUserMedia     ||
                        nav.webkitGetUserMedia  ||
                        nav.msGetUserMedia          ).bind(nav);
}


if ( !win.AudioContext ) {

  win.AudioContext = win.webkitAudioContext;
}


/** PeerConnection **/

if ( typeof win.RTCPeerConnection !== 'function' ) {

  win.RTCPeerConnection = win.mozRTCPeerConnection    ||
                          win.webkitRTCPeerConnection;


  /** Modify the configurations to adjust the different address formats **/
  win.RTCPeerConnection = (function(){

    var vendorConnection = win.RTCPeerConnection;

    // innerReference ?
    var Chrome  = chrome,
        Firefox = moz;

    return function adjustServer ( addresses, constraints ) {

      var iceServers = addresses.iceServers,

          current, server, url, type;

      for ( var i = 0, l = iceServers.length; i < l; i++ ) {

        current = iceServers[i];
        server  = null;

        url     = current.url;
        type    = url.split(':')[0];

        if ( type === 'stun' ) server = { url: url };

        if ( type === 'turn' ) server = parseTURN( url, current.username, current.credential ) || {};

        if ( !server.url ) throw new Error('Invalid server address!', current, server );

        iceServers[i] = server;
      }

      return new vendorConnection( addresses, constraints );
    };


    /** Select the appropriate TURN version **/

    function parseTURN ( url, username, credential ) {

      if ( Firefox ) {

        if ( url.indexOf('transport=udp') !== -1 || url.indexOf('?transport') === -1 ) {

          return { url: url.split('?')[0], credential: credential, username: username };
        }
      }

      if ( Chrome ) {

        if ( Chrome > 28 ) return { url: url, credential: credential, username: username };

        return { url: 'turn:' + username + '@' + url.split('turn:')[1], credential: credential };
      }
    }

  })();

}


/** Firefox **/

if ( typeof win.RTCSessionDescription !== 'function' ) {

  win.RTCSessionDescription = win.mozRTCSessionDescription;
}


if ( typeof win.RTCIceCandidate !== 'function' ) {

  win.RTCIceCandidate = win.mozRTCIceCandidate;
}


/** Provide placeholder audio/video tracks for consistency **/

if ( moz ) {

  // or mozMediaStream ? // return this.videoTracks

  MediaStream.prototype.getVideoTracks = function(){
    return [];
  };

  MediaStream.prototype.getAudioTracks = function(){
    return [];
  };

}




/** Chrome **/

if ( win.webkitRTCPeerConnection && !win.webkitRTCPeerConnection.prototype.getLocalStreams ) {

  // New Syntax of getXXStreams in M26
  win.webkitRTCPeerConnection.prototype.getLocalStreams = function(){
    return this.localStreams;
  };

  win.webkitRTCPeerConnection.prototype.getRemoteStreams = function(){
    return this.remoteStreams;
  };


  // Streaming tracks got changed in M26
  if ( !win.webkitMediaStream.prototype.getVideoTracks ) {

    win.webkitMediaStream.prototype.getVideoTracks = function(){
      return this.videoTracks;
    };

    win.webkitMediaStream.prototype.getAudioTracks = function(){
      return this.audioTracks;
    };
  }

}
