/**
 *  Adapter
 *  =======
 *
 *  Normalize different browser behavior - using prefixes and workarounds.
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

    function handle() { callbacks.shift()(); }

    return function ( fn ) {

      if ( typeof fn !== 'function' ) throw Error('Invalid Argument');

      callbacks.push( fn );

      win.postMessage( 'setImmediate', '*' );
    };

  })();
}


/** user MediaStream **/

if ( !navigator.getUserMedia ) {

  navigator.getUserMedia =  navigator.mozGetUserMedia     ||
                            navigator.webkitGetUserMedia  ||
                            navigator.msGetUserMedia;
}


/** PeerConnection **/

if ( typeof win.RTCPeerConnection !== 'function' ) {

  win.RTCPeerConnection = win.mozRTCPeerConnection    ||
                          win.webkitRTCPeerConnection;
}


/** Firefox **/

if ( typeof win.RTCSessionDescription !== 'function' ) {

  win.RTCSessionDescription = win.mozRTCSessionDescription;
}


if ( typeof win.RTCIceCandidate !== 'function' ) {

  win.RTCIceCandidate = win.mozRTCIceCandidate;
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
