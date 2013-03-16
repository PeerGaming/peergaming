/**
 *	Adapter
 *	=======
 *
 *	Normalize different browser behavior.
 */

var win = window;


/**
 *  Performance
 */

if ( !win.performance ) {

	win.performance = { now: Date().now() };

} else if ( !win.performance.now ) {

	win.performance.now = win.performance.webkitNow;
}



/**
 *	Blob & ObjectURL
 */

if ( !win.URL ) {

	win.URL = win.webkitURL || win.msURL || win.oURL;
}

if ( !win.Blob && !win.BlobBuilder ) {

	win.BlobBuilder =	win.BlobBuilder			||
						win.WebKitBlobBuilder	||
						win.MozBlobBuilder		||
						win.MSBlobBuilder		||
						win.OBlobBuilder;
}


/**
 *	PeerConnection & User Media
 */

if ( !win.RTCPeerConnection ) {

	win.RTCPeerConnection =	win.mozRTCPeerConnection		||
							win.webkitRTCPeerConnection;
}

if ( !navigator.getUserMedia ) {

	navigator.getUserMedia =	navigator.mozGetUserMedia		||
								navigator.webkitGetUserMedia	||
								navigator.msGetUserMedia;
}

// Firefox handling
if ( !win.RTCSessionDescription ) {

	win.RTCSessionDescription = win.mozRTCSessionDescription;
}


if ( !win.RTCIceCandidate ) {

	win.RTCIceCandidate = win.mozRTCIceCandidate;
}


// Chrome handling
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
