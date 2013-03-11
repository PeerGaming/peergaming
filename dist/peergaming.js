/**
 *	peergaming.js - v0.1.5 | 2013-03-11
 *	http://peergaming.net
 *	Copyright (c) 2013, Stefan Dühring
 *	MIT License
 */

(function ( name, context, definition ) {

	if ( typeof module !== 'undefined' ) {

		module.exports = definition( context );

	} else if ( typeof define !== 'undefined' ) {

		define( name, function(){ return definition( context ); });

	} else {

		context[name] = definition( context );
	}

})('pg', this, function ( context, undefined ) {

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

if ( win.performance && !win.performance.now ) {

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

/**
 *	Detect
 *	======
 *
 *	Checks if the required features or status is supported by the browser.
 *
 *	ToDo:
 *
 *	- DataChannel
 *	- ServerSent Events/WebSocket
 */

var moz = !!navigator.mozGetUserMedia,

	features = [ 'URL', 'Blob', 'indexedDB', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

	if ( !(features[i] in win ) ) console.log( 'Missing: ', features[i] );
}

if ( !win.RTCPeerConnection ) throw new Error('Your browser doesn\'t support PeerConnections yet.');

/**
 *	Base
 *	====
 *
 *	Basic wrapper definitions.
 */

var pg = function(){

};

pg.VERSION = '0.1.5';


var ready = false;

var instance;	// used for single reference !

pg.queue = [];


/**
 *	Extends properties of an Object.
 *
 *	@param  {[type]} target [description]
 *	@return {[type]}        [description]
 */

function extend ( target ) {

	var source, key;

	for ( var i = 1, length = arguments.length; i < length; i++ ) {

		source = arguments[i];

		for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
	}

	return target;
}


/**
 *	Event
 *	=====
 *
 *	Message handling using a Mediator (publish/subscribe).
 */

extend( pg, function(){

	'use strict';

	// cache
	var channels = {};


	/**
	 * Register callbacks to topics.
	 *
	 * @param  {String}   topics	- topics to subscribe
	 * @param  {Function} callback	- function which should be executed on call
	 * @param  {Object}   context	- specific context of the execution
	 */
	function subscribe ( topics, callback, context ) {

		topics = topics.split(' ');

		var length = topics.length,	topic;

		while ( length-- ) {

			topic = topics[ length ];

			if ( !channels[ topic ] ) channels[ topic ] = [];

			channels[ topic ].push([ callback, context ]);
		}
	}


	/**
	 * Send data to subscribed functions.
	 *
	 * @param  {String}		topic		-	topic to send the data
	 * @params	......		arguments	-	arbitary data
	 */
	function publish ( topic ) {

		var listeners = channels[ topic ];

		if ( listeners ) {

			var args = Array.prototype.slice.call( arguments, 1 ),

				length = listeners.length;

			while ( length-- ) {

				listeners[length][0].apply( listeners[length][1], args || [] );
			}
		}
	}


	/**
	 * Unsubscribe callbacks from a topic.

	 * @param  {String}		topic		- topic of which listeners should be removed
	 * @param  {Function}	callback	- specific callback which should be removed
	 */
	function unsubscribe ( topic, callback ) {

		if ( !callback ) {

			channels[ topic ].length = 0;

		} else {

			var listeners = channels[ topic ],

				length = listeners ? listeners.length : 0;

			while ( length-- ) {

				if ( listeners[ length ] === callback ) {

					listeners.splice( length, 1 ); break;
				}
			}
		}
	}


	return {

		on	: subscribe,
		emit: publish,
		off	: unsubscribe
	};

}());


/**
 *	Promise
 *	=======
 *
 *	Async flow control handling.
 */

extend( pg, function(){

	'use strict';

	var promise = {};

	return {


	};

}());

/**
 *	Statemachine
 *	============
 *
 *	Handling different steps
 */

extend( pg, function(){

	'use strict';

	var statemachine = {};

	return {


	};

}());


/**
 *	LinkedList
 *	==========
 *
 *	A data structure to bind/connect a list of entries.
 */

var LinkedList = (function(){

	'use strict';

	var linkedList = function(){

	};

	return {


	};

}());

/**
 *	Hashtable
 *	=========
 *
 *	A data structure used for key-value storage.
 */

var Hashtable = (function(){

	'use strict';

	var hashtable = function(){

	};

	return {


	};

}());


/**
 *	Default
 *	=======
 *
 *	Default configurations for the network.
 */

pg.config = {

	server:	'http://localhost:2020'
};



var peerconfig = {

		iceServers:	[{

			url: !moz ? 'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
		}]
	},

	connectionConstraints = {

		optional: [{

			RtpDataChannels			: true
			// DtlsSrtpKeyAgreement	: moz ? null : true
		}]
	},

	mediaConstrains = {

		optional: [],

		mandatory: {

			OfferToReceiveAudio		: true,
			OfferToReceiveVideo		: true
		}
	};

if ( moz ) mediaConstrains.mandatory.MozDontOfferDataChannel = true;

peerconfig = null;

/**
 *  Transport
 *  =========
 *
 *  Communication layer used to communicate with the server.
 *
 *  First using WebSocket or XHR - later replaced through the specific DataChannel reference.
 */

var transport = (function(){

	'use strict';

	// server just checks if the response is still open ! || would then depend more likely on the server....

	win.addEventListener('beforeunload', logout );
	win.addEventListener('DOMContentLoaded', logout );

	// SSE

	function req ( msg, next ) {

		var xhr = new XMLHttpRequest();	// try pool for caching !

		xhr.open( 'POST', pg.config.server, true );

		if ( next ) {

			xhr.onload = function ( e ) {

				xhr.onload = null;
				next( e.currentTarget.response );
			};
		}

		xhr.setRequestHeader( 'Content-Type', 'text/plain; charset=UTF-8' );
		xhr.send( JSON.stringify(msg) );
	}











	function init ( id, next ) {

		var msg = {	action: 'register', data: id };

		sessionStorage.id = id;

		// XHR
		req( msg, function ( remoteID ) {

			listenToServer( id, function(){

				next( remoteID );
			});
		});
	}




	// remove entry from the server - end
	function logout ( e ) {

		if ( sessionStorage.id ) {

			// XHR
			var msg = { action: 'remove', data: sessionStorage.id };

			req( msg, function(){

				if ( !ready ) {	// beforeunload callback

					delete sessionStorage.id;

					ready = true;

					if ( pg.queue.length ) {

						for ( var i = 0, l = pg.queue.length; i < l; i++ ) {
							pg.queue[i]();
						}
					}
				}
			});

		} else {

			// execute queue !
			ready = true;

			if ( pg.queue.length ) {

				for ( var i = 0, l = pg.queue.length; i < l; i++ ) {
					pg.queue[i]();
				}
			}
		}
	}



	function listenToServer ( id, next ) {





		// XHR

		// ## ToDo
		//
		//
		//
		// -	Ajax based Stream Polling:
		//		http://www.codekites.com/ajax-based-streaming-without-polling/
		//
		// -	still receiving error as it's closed...

		var source;

		try {

			source = new EventSource( pg.config.server + '/' + id );

			source.addEventListener('open', function ( e ) {

				// console.log('open');
				next();	// ensure open stream
			});

			source.addEventListener('message', handleMessage );
			source.addEventListener('error', handleError );

		} catch ( e ) {

			console.log(e);
		}
	}




	// interface for parsing messages
	function handleMessage ( e ) {

		var msg = JSON.parse( e.data );

		if ( instance.connections[ msg.local ] ) {

			instance.connections[ msg.local ][ msg.action ]( msg.data );

		} else { // input -> offer / candidate

			instance.connect( msg.local, msg.data );
		}
	}




	function handleError ( e ) {

		// XHR
		if ( e.eventPhase === EventSource.CLOSED ) {

			console.log('[close]');

		} else {

			throw new Error( e.data );
		}

		var source = e.currentTarget;

		source.close();
	}


	function send ( msg )  {

		// first - as no other network
		req( msg );
	}



	return {

		init: init,
		send: send
	};


})();


/**
 *  Connection
 *  ==========
 *
 *  A wrapper for PeerConnections.
 */

var Connection = (function(){

	'use strict';


	var media = !false;

	var Connection = function ( localID, remoteID, input ) { //

		this.localID	= localID;
		this.remoteID	= remoteID;
		this.input		= input;

		this.channels = {};

		this.conn = new RTCPeerConnection( peerconfig, connectionConstraints );

		if ( media ) {

			this.attachMediaStreams();

		} else {

			this.init();
		}
	};


	Connection.prototype.init = function(){

		var input		= this.input,
			localID		= this.localID,
			remoteID	= this.remoteID;

		if ( !input ) {

			this.createOffer();

			// this.createDataChannel( 'sendChannel' );

		} else {

			if ( input.candidate ) {	// inital command was ICE

				console.log('[input - candidate]');

				this.setIceCandidates( input );

			} else {					// initial command was SDP

				console.log('[input - offer]');

				this.setConfigurations( input );
			}
		}

		// this.handleChanges();

		this.receiveDataChannel();

		this.findICECandidates();
	};


	//
	Connection.prototype.handleChanges = function(){

		this.conn.onnegotiationneeded = function ( e ) {

			console.log('[negotiation needed]');

			this.createOffer();

		}.bind(this);
	};


	// SDP enhancemend
	Connection.prototype.attachMediaStreams = function(){

		var conn = this.conn;

		conn.onaddstream = function ( e ){

			console.log('[added stream]');

			var video = document.createElement('video');
			video.src = URL.createObjectURL( e.stream );
			video.autoplay = true;

			var box = document.createElement('div');
			box.textContent = this.remoteID;
			box.className = 'name';
			box.appendChild(video);

			document.body.appendChild( box );

		}.bind(this);

		conn.onremovestream = function ( e ) {

			console.log('[removed stream]');

			// document.getElementById('vid2').src = null;
			// URL.revokeObjectURL( e.stream );
		};

		// device access
		var permissions = { audio: true, video: true };

		navigator.getUserMedia( permissions, function ( stream ) {

			conn.addStream( stream );

			// document.getElementById('vid1').src = URL.createObjectURL(stream);

			// var videoTracks = stream.getVideoTracks(),
				// audioTracks = stream.getAudioTracks();

			this.init();

		}.bind(this));
	};


	Connection.prototype.receiveDataChannel = function(){

		var conn = this.conn;

		// remote created channel
		conn.ondatachannel = function ( e ) {

			console.log('[remote channel]');

			var channel = e.channel;

			//channel.binaryType = 'arraybuffer'; // 'blob'

			channel.onopen = function ( e ) {

				console.log('[opened channel]');
				console.log(e);
			};

			channel.onmessage = function ( e ) {

				console.log('[message]');
				console.log( e );
				console.log( e.data );

				// if ( e.data instanceof Blob ) {
				//	console.log('blob');
				// } else {

				// console.log('msg');
				// }
			};

			channel.onclose = function ( e ) {

				console.log('[closed channel]');
				console.log(e);
			};


			this.channel = channel;

			pg.emit('connection', channel );

		}.bind(this);
	};


	Connection.prototype.createDataChannel = function ( name ) {

		var channel = this.conn.createDataChannel( name, moz ? {} : { reliable: false });

		channel.onopen = function ( e ) {

			// var readyState = channel.readyState;
			// console.log(readyState);

			console.log('[open channel]');
			console.log(e);

			channel.onmessage = function ( e ) {

				console.log('[message]');
				console.log(e);

				var msg = e.data;
				console.log(msg);
			};

			channel.onclose = function ( e ) {

				console.log('[close]');
				console.log(e);
			};

			channel.onerror = function ( e ) {

				console.log('[error]');
				console.log(e);
			};

			this.channels[name] = channel;

			pg.emit('connection', channel );

		}.bind(this);
	};



	// find ICE candidates
	Connection.prototype.findICECandidates = function(){

		this.conn.onicecandidate = function ( e ) {

			if ( e.candidate ) {

				this.send({ action: 'setIceCandidates', data: e.candidate });
			}

		}.bind(this);
	};



	Connection.prototype.createOffer = function() {

		var conn = this.conn;

		conn.createOffer( function ( offer ) {	// desc

			// interOp ?

			conn.setLocalDescription( offer, function(){

				console.log('[created offer]');

				this.send({ action: 'setConfigurations', data: offer });

			}.bind(this));

		}.bind(this), function(eer){
			console.log(eer);
		});
	};


	// needs a description first !
	Connection.prototype.setIceCandidates = function ( data ) {

		var conn = this.conn;

		if ( conn.remoteDescription || conn.localDescription ) {

			if ( this._candidates ) delete this._candidates;

			data = Array.isArray(data) ? data : [ data ];

			for ( var i = 0, l = data.length; i < l; i++ ) {

				conn.addIceCandidate( new RTCIceCandidate( data[i] ) );
			}

		} else {

			if ( !this._candidates ) this._candidates = [];

			this._candidates.push( data );
		}
	};



	// SDP exchange
	Connection.prototype.setConfigurations = function ( msg ) {

		console.log('[Description | SDP - ' +  msg.type + ' ]');

		var conn = this.conn,

			desc = new RTCSessionDescription( msg );


		// ToDo:

		conn.setRemoteDescription( desc, function(){

			if ( this._candidates ) this.setIceCandidates( this._candidates );

			if ( msg.type === 'offer' ) {

				conn.createAnswer( function ( answer ) {

					conn.setLocalDescription( answer, function(){

						this.send({ action: 'setConfigurations', data: answer });

					}.bind(this), function(eer){
						console.log(eer);
					});

				}.bind(this), null, mediaConstrains );
			}

		}.bind(this), function(eer){

			console.log(eer);
		});
	};



	Connection.prototype.send = function ( msg ) {

		msg.local = this.localID,
		msg.remote = this.remoteID;

		// will be replace by a reference to the channel - as its established
		transport.send( msg );
	};


	Connection.prototype.close = function(){

		var channels = this.channels,
			keys = Object.keys(channels);

		for ( var i = 0, l = keys.length; i < l; i++ ) {

			channels[ keys[i] ].close();
			delete channels[ keys[i] ];
		}
	};

	return Connection;

})();



// local logger !

// logger( ) - enumerates the way - used for backtracing // remote logger !

// function loggerr ( e ) {

// 	console.log( e );

// 	transport.send({ type: debug, data: })
// }





/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */

pg.Peer = function ( name ) {

	'use strict';

	var Peer = (function(){


		var Peer = function ( name ) {

			// if ( options ) {

			//	extend( pg.config, options );
			// }

			this.name = name;

			this.id = createId( name );

			this.stores = {};			// DHT Storage - global level

			this.connections = {};


			var register = function(){

				transport.init(	this.id, function ( remoteID ) { // .then()

					if ( remoteID ) {

						this.connect( remoteID );

					} else {

						// this.stores.global = new DHT( pg.config.dht );
					}

				}.bind(this));

			}.bind(this);


			if ( ready ) {

				register();

			} else {

				pg.queue.push( register );
			}
		};


		Peer.prototype.connect = function ( remoteID, input ) {

			if ( this.connections[remoteID] ) return;

			console.log( 'connect to "' + remoteID + '"' );

			this.connections[ remoteID ] = new Connection( this.id, remoteID, input );
		};


		// Peer.prototype.on = pg.on;


		// ToDo: Use a timestemp for ID calculation  ?
		function createId ( name ) {

			var id = name;
			// var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			//	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			//	return v.toString(16);
			// });

			return id;
		}

		return Peer;

	})();



	return instance || ( instance = new Peer( name ) );
};


/**
 *	Loop
 *	====
 *
 *	The main game loop (engine), handling processing/rendering.
 *	jshint devel:true
 */

extend( pg, function(){

	'use strict';

	var loop = {};

	return {


	};

}());

/**
 *	Stats
 *	=====
 *
 *	Tracking stats, providing them to an external interface.
 */

extend( pg, function(){

	'use strict';

	var promise = {};

	return {


	};

}());



	return pg;
});
