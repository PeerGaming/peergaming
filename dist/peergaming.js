/**
 *	peergaming.js - v0.2.0 | 2013-03-26
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
 *	setImmediate
 */

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

	reliable = false,

	features = [ 'URL', 'Blob', 'crypto', 'indexedDB', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

	if ( !(features[i] in win ) ) console.log( 'Missing: ', features[i] );
}

if ( !win.RTCPeerConnection ) throw new Error('Your browser doesn\'t support PeerConnections yet.');


try {

	var pc = new RTCPeerConnection( null ),

		dc = pc.createDataChannel( '[detect]', { reliable: false });

} catch ( err ) {

	// console.log(err);

	if ( err.code !== 9 || moz ) throw new Error('Your browser doesn\'t support DataChannels yet.');

} finally { pc = null; }


var littleEndian = (function(){

    var arr32   = new Uint32Array(1),
        arr8    = new Uint8Array( arr32.buffer );

    arr32[0] = 255;

    return !!arr8[0];   // 255 0 0 - litte	||	0 0 255 - big
})();

/**
 *  Debug
 *  =====
 *
 *  Debugging calls for development.
 */


/**
 *  log
 *
 *  Log information - display the text in a structured manner !
 *  @return {[type]} [description]
 */

function debug ( text ) {

	if ( !instance || !localStorage.log ) {

		localStorage.log = 0;
	}

	if ( text[text.length - 1] === '\n' ) {

		text = text.substring( 0, text.length - 1 );
	}

	var num = ++localStorage.log,
		msg = '(' + num + ') - ' + ( (performance.now()) / 1000 ).toFixed(3) + ': ' + text;

	console.log( msg );
}

win.clearDebug = function() {

	delete localStorage.log;
};


/**
 *  logger
 *
 *  Logging errors
 *  @param  {[type]} err [description]
 *  @return {[type]}     [description]
 */
function loggerr ( err )  {

	console.log('[error]');
	console.log( err , err.name + ': ' + err.message );
}

// check for debugging (in chrome)
//
// https://github.com/adamschwartz/chrome-inspector-detector
//
// +
//
// http://stackoverflow.com/questions/7527442/how-to-detect-chrome-inspect-element-is-running-or-not/15567735#15567735

function debugging(){

	// firebug
	if ( moz ) return !!console.log;

	// chrome
	var existingProfiles = console.profiles.length;

	console.profile();
	console.profileEnd();

	if ( console.clear ) console.clear();

	return console.profiles.length > existingProfiles;
}


/**
 *	Base
 *	====
 *
 *	Basic wrapper definitions.
 */

var pg = function(){};

pg.VERSION = '0.2.0';


// Collection of all connected peers
pg.peers = {};


var READY_STATES = {

	0: 'connecting',
	1: 'open',
	2: 'closing',
	3: 'closed'
};


// internal variables

var instance;				// Singleton reference

/**
 *	Default
 *	=======
 *
 *	Default configurations for the network.
 */


var config = {

	channelConfig: {

		BANDWIDTH	: 1024 * 1000,		// 1MB			// prev:  1638400	|| 1600 - increase DataChannel width

		MAX_BYTES	: 1024 *   1,		// 1kb			// max bytes throughput of a DataChannel
		CHUNK_SIZE	:  600								// size of the chunks - in which the data will be splitt
	},


	socketConfig: {

		server: 'ws://localhost:2020'		// bootstrapping server address
	},


	peerConfig: {

		iceServers:	[{

			url: !moz ? 'stun:stun.l.google.com:19302' :	// address for STUN / ICE server
						'stun:23.21.150.121'
		}]
	},



	connectionConstraints: {

		optional: [{

			RtpDataChannels			: true					// enable DataChannel
		}]
	},



	mediaConstraints: {

		mandatory: {										// required permissions

			OfferToReceiveAudio		: true,
			OfferToReceiveVideo		: true
		},

		optional: []
	},

	videoConstraints: {										// e.g. android

		mandatory: {

			maxHeight	: 320,
			maxWidth	: 240
		},

		optional: []
	}

};

if ( moz ) {

	config.mediaConstraints.mandatory.MozDontOfferDataChannel		= true;
	config.connectionConstraints.optional[0].DtlsSrtpKeyAgreement	= true;
}


/**
 *  Misc
 *  ====
 *
 *  Collection of simple helpers.
 */


var utils = {};


// improved typeof
// utils.check = function ( obj ) {

//	return Object.prototype.toString.call( obj ).slice( 8, -1 );
// };


/**
 *	Extends properties of an Object.
 *
 *	@param  {[type]} target [description]
 *	@return {[type]}        [description]
 */

utils.extend = function extend ( target ) {

	var source, key;

	for ( var i = 1, length = arguments.length; i < length; i++ ) {

		source = arguments[i];

		for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
	}

	return target;
};


// form original nodejs
// https://github.com/joyent/node/blob/master/lib/util.js

utils.inherits = function inherits ( child, parent ) {

	child.prototype = Object.create( parent.prototype, {

		constructor: {

			value			: child,
			enumerable		: false,
			writable		: true,
			configurable	: true
		}
	});
};


utils.getToken = function getToken() {

	return Math.random().toString(36).substr( 2, 10 );
};


// Based on @broofa:
// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523

utils.createUID = function createUID() {

	var pool = new Uint8Array( 1 ),

		random, value,

		id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function ( c ) {

			random = crypto.getRandomValues( pool )[0] % 16;

			value = ( c === 'x' ) ? random : (random&0x3|0x8);

			return value.toString(16);
		});

	return id;
};



// String/Buffer Conversion
// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String

utils.StringToBuffer = function StringToBuffer ( str ) {

	var buffer	= new ArrayBuffer( str.length * 2 ), // 2 bytes per char
		view	= new Uint16Array( buffer );

	for ( var i = 0, l = str.length; i < l; i++ ) {

		view[i] = str.charCodeAt(i);
	}

	return buffer;
};


utils.BufferToString = function BufferToString ( buffer ) {

	return String.fromCharCode.apply( null, new Uint16Array( buffer ) ) ;
};


/**
 *  Queue
 *  =====
 *
 *  Storing commands on a list - executing them later.
 */

/**
 *  queue
 *
 *  Pushing actions on to a list.
 *  @param  {Function} fn [description]
 *  @return {[type]}      [description]
 */

var Queue = (function(){


	var Queue = function(){

		this.ready	= false;

		this.list	= [];
	};


	/**
	 *  add a function to the list
	 *  @param {Function} fn [description]
	 */

	Queue.prototype.add = function ( fn ) {

		if ( typeof fn === 'function' ) {

			this.list.push( fn );
		}
	};


	/**
	 *  Execute the stored functions
	 *  @return {[type]} [description]
	 */

	Queue.prototype.exec = function() {

		this.ready = true;

		var args = Array.prototype.slice.call( arguments ),

			list = this.list;

		while ( list.length ) {

			list.pop().apply( null, args );
		}
	};


	Queue.prototype.clear = function(){

		this.list.length = 0;
	};

	return Queue;

})();


/**
 *	Event
 *	=====
 *
 *	Message handling using a Mediator (publish/subscribe).
 */

var Emitter = (function(){

	'use strict';


	/**
	 *  Constructor
	 */
	var EventEmitter = function(){

		this._events = {};

		return this;
	};


	/**
	 * Register callbacks to topics.
	 *
	 * @param  {String}   topics	- topics to subscribe
	 * @param  {Function} callback	- function which should be executed on call
	 * @param  {Object}   context	- specific context of the execution
	 */

	EventEmitter.prototype.on = function ( topics, callback, context ) {

		if ( typeof callback !== 'function' ) return;

		topics = topics.split(' ');

		var events	= this._events,
			length	= topics.length,
			topic;

		while ( length-- ) {

			topic = topics[ length ];

			if ( !events[ topic ] ) events[ topic ] = [];

			events[ topic ].push([ callback, context ]);
		}

		return this;
	};



	EventEmitter.prototype.once = function ( topics, callback, context ) {

		this.on( topics, function once() {

			this.off( type, once );

			callback.apply( this, arguments );

		}.bind(this));
	};


	/**
	 * Send data to subscribed functions.
	 *
	 * @param  {String}		topic		-	topic to send the data
	 * @params	......		arguments	-	arbitary data
	 */

	EventEmitter.prototype.emit = function ( topic ) {

		var events		= this._events,
			listeners	= events[ topic ];

		if ( listeners ) {

			var args = Array.prototype.slice.call( arguments, 1 ),

				length = listeners.length;

			while ( length-- ) {

				listeners[length][0].apply( listeners[length][1], args || [] );
			}
		}
	};


	/**
	 * Unsubscribe callbacks from a topic.
	 *
	 * @param  {String}		topic		- topic of which listeners should be removed
	 * @param  {Function}	callback	- specific callback which should be removed
	 */

	EventEmitter.prototype.off = function ( topic, callback ) {

		var events		= this._events,
			listeners	= events[ topic ];

		if ( !listeners ) return;

		if ( !callback ) {

			events[ topic ].length = 0;

		} else {

			var length = listeners.length;

			while ( length-- ) {

				if ( listeners[ length ] === callback ) {

					listeners.splice( length, 1 ); break;
				}
			}
		}

	};

	return EventEmitter;

})();

/**
 *  Stream
 *  ======
 *
 *  Interface for streaming activities.
 */


var Stream = (function(){

	'use strict';

	var Stream = function ( options ) {

		Emitter.call(this);

		if ( !options ) options = {};

		this.readable	= options.readable;
		this.writeable	= options.readable;

		this.ready		= true;
		// this.offset		= 0;						// current offset - used to merge chunks ?

		this.writeBuffer	= [];
		this.readBuffer		= [];
	};


	utils.inherits( Stream, Emitter );


	Stream.prototype.handle = function ( e ) {

		var msg		= e.data,

			data	= JSON.parse( msg ),

			buffer	= this.readBuffer;


		if ( data.part !== void 0 ) {

			buffer.push( data.data );

			this.emit( 'data', data, buffer.length );

			if ( data.part > 0 ) return;

			msg = buffer.join('');

			buffer.length = 0;
		}

		this.emit( 'end', msg );
	};


	// ToDo:	check if others are empty - open ,
	//			else push on queue and wait till finish !
	// stream has to handle readystate etc.

	Stream.prototype.write = function ( msg ) {

		this.writeBuffer.push( msg );

		if ( this.ready ) {

			this.emit( 'write', this.writeBuffer.shift() );

		} else {

			// handle simoultanous accessing - using queue, messages etc.
		}

		return this.ready;
	};


	Stream.prototype.pipe = function ( trg ) {

		this.on('data', function ( chunk ) {

			trg.handle( chunk );
		});

		return trg;
	};

	return Stream;

})();


/**
 *  Handler
 *  =======
 *
 *  Delegating through error - close, messaging events. // // handler for a new channel
 */


var Handler = (function(){

// if ( options ) customHandlers[ label ] = options;

	var Handler = function ( channel, remote ) {	// remote not required, as already assigned

		var label		= channel.label;

		this.info		= {

			label	: label,
			remote	: remote
		};


		this.channel	= channel;

		this.stream		= new Stream({ readable: true, writeable: true });


		this.actions	= defaultHandlers[ label ] || defaultHandlers.custom;

		if ( typeof this.actions === 'function' ) this.actions = { end: this.actions };

		channel.addEventListener( 'open', this.init.bind(this) );
	};


	Handler.prototype.init = function ( e ) {

		// console.log('[open] - '  + this.label );

		var channel		= this.channel,

			actions		= this.actions,

			stream		= this.stream,

			connection	= instance.connections[ this.info.remote ],

			events = [ 'open', 'data', 'end', 'close', 'error' ];


		for ( var i = 0, l = events.length; i < l; i++ ) {

			stream.on( events[i], actions[ events[i] ], connection );
		}

		stream.on( 'write', function send ( msg ) { channel.send( msg ); });


		channel.onmessage	= stream.handle.bind( stream );

		channel.onclose		= function() { stream.emit( 'close' );	};

		channel.onerror		= function ( err ) { stream.emit( 'error', err ); };

		stream.emit( 'open', e );
	};


	// currently still required to encode arraybuffer to to strings...
	// // Using Strings instead an arraybuffer....
	Handler.prototype.send = function ( msg ) {

		var data = JSON.stringify( msg ),

			buffer = data; //utils.StringToBuffer( data );


		if ( buffer.length > config.channelConfig.MAX_BYTES ) {
		// if ( buffer.byteLength > config.channelConfig.MAX_BYTES ) {

			buffer = createChunks( buffer );	// msg.remote...

		} else {

			buffer = [ buffer ];
		}

		for ( var i = 0, l = buffer.length; i < l; i++ ) {

			this.stream.write( buffer[i] );
		}
	};


	function createChunks ( buffer ) {

		var	maxBytes	= config.channelConfig.MAX_BYTES,
			chunkSize	= config.channelConfig.CHUNK_SIZE,
			size		= buffer.length, //byteLength,
			chunks		= [],

			start		= 0,
			end			= chunkSize;

		while ( start < size ) {

			chunks.push( buffer.slice( start, end ) );

			start = end;
			end = start + chunkSize;
		}

		var l = chunks.length,
			i = 0;				// increment

		while ( l-- ) {

			chunks[l] = JSON.stringify({ part: i++, data: chunks[l] });
		}

		return chunks;
	}


	return Handler;

})();

/**
 *  Default
 *  =======
 *
 *  Default Handler for common task (e.g. estbalish mesh network).
 *  Context will be the on of the connection ? or like before from the handler ?
 */

// custom handler collection

// var customHandlers = {};
// customHandlers[ label ] ||

var defaultHandlers = {

	init: {

		open: function() {

			// channel established && open
			delete this.info.pending;

			this.send( 'init', {

				name: instance.name,

				list: Object.keys( instance.connections )
			});
		},

		end: function ( msg ) {

			var data = JSON.parse( msg ),

				peer = pg.peers[ this.info.remote ];

			utils.extend( peer, { name: data.name });

			instance.emit( 'connection', peer );

			// ToDo: refactor with .connect()
			instance.checkNewConnections( data.list, this );
			// providing transport - register delegation
		},

		close: function ( msg ) {

			console.log('[closed]');

			console.log(msg);
		}

	},


	register: function ( msg ) {

		var data = JSON.parse( msg );

		if ( data.remote !== instance.id ) {	// proxy

			// just handler between - setting up for remote delegation
			// console.log( '[proxy] ' + data.local + ' -> ' + data.remote );
			instance.connections[ data.remote ].send( 'register', data );

		} else {

			if ( !instance.connections[ data.local ] ) {

				instance.connect( data.local, false, this );
			}

			instance.connections[ data.local ][ data.action ]( data.data );
		}
	},


	custom: function ( msg ) {

		console.log('[channel doesn\'t exist yet - local delegation');

		var data = JSON.parse( msg );

		console.log(data.action);

	},


	message: function ( msg ) {

		instance.emit( 'message', msg );
	}

};


/**
 *  Socket
 *  ======
 *
 *  Transport layer used to communicate with the server.
 *
 *  First using WebSocket or XHR - later replaced through the specific DataChannel reference.
 */



var socketQueue = new Queue();

var socket = (function(){

	'use strict';

	// SSE
	win.addEventListener('beforeunload', logout );
	win.addEventListener('DOMContentLoaded', logout );


	/**
	 *  [req description]
	 *
	 *  Request for EventSource / Polling
	 *  @param  {[type]}   msg  [description]
	 *  @param  {Function} next [description]
	 *  @return {[type]}        [description]
	 */

	function req ( msg, next ) {

		// ToDo: pooling the request objects
		var xhr = new XMLHttpRequest();

		xhr.open( 'POST', config.socketConfig.server, true );

		if ( next ) {

			xhr.onload = function ( e ) {

				xhr.onload = null;
				next( e.currentTarget.response );
			};
		}

		xhr.setRequestHeader( 'Content-Type', 'text/plain; charset=UTF-8' );
		xhr.send( msg );
	}


	/**
	 *  [logout description]
	 *
	 *  Remove ID from the server.
	 *  @param  {[type]} e [description]
	 *  @return {[type]}   [description]
	 */

	function logout() {

		// no manual logout required
		if ( config.socketConfig.server.split(':')[0] !== 'http' ) {	//

			socketQueue.ready = true;
			return;
		}

		if ( sessionStorage.id ) {

			// XHR
			var msg = { action: 'remove', data: sessionStorage.id };

			send( msg, function(){

				if ( !socketQueue.ready ) {	// beforeunload callback

					delete sessionStorage.id;

					socketQueue.exec();
				}
			});

		} else {

			socketQueue.exec();
		}
	}


	/**
	 *  [init description]
	 *
	 *  Register on the server.
	 *  @param  {[type]}   id   [description]
	 *  @param  {Function} next [description]
	 *  @return {[type]}        [description]
	 */

	function init ( id, next ) {

		sessionStorage.id = id;

		connectToServer( id, function(){

			var msg = {	action: 'lookup', data: id };

			send( msg, function ( remoteID ) {

				next( remoteID );
			});
		});
	}


	/**
	 *  [listenToServer description]
	 *
	 *  Attach Server
	 *  @param  {[type]}   id   [description]
	 *  @param  {Function} next [description]
	 *  @return {[type]}        [description]
	 */

	var socket;

	function connectToServer ( id, next ) {

		function handleOpen() { next();	}

		if ( config.socketConfig.server.split(':')[0] === 'http' ) {	// XHR

			socket = new EventSource( config.socketConfig.server + '/' + id );

		} else {		// WS

			socket = new WebSocket( config.socketConfig.server + '/' + id );
		}

		socket.addEventListener( 'open'		, handleOpen );
		socket.addEventListener( 'message'	, handleMessage );
		socket.addEventListener( 'error'	, handleError );
	}


	/**
	 *  [handleMessage description]
	 *
	 *  Interface for parsing messages.
	 *  @param  {[type]} e [description]
	 *  @return {[type]}   [description]
	 */

	function handleMessage ( e ) {

		var msg = JSON.parse( e.data );

		if ( !msg || !msg.local ) {	// receive partner via socket

			socketQueue.exec( msg );
			return;
		}

		if ( !instance.connections[ msg.local ] ) {

			instance.connect( msg.local );
		}

		// SDP & Candidates
		instance.connections[ msg.local ][ msg.action ]( msg.data );
	}


	/**
	 *  [handleError description]
	 *
	 *  Handling errors.
	 *  @param  {[type]} e [description]
	 *  @return {[type]}   [description]
	 */

	function handleError ( e ) {


		// XHR
		if ( e.eventPhase === EventSource.CLOSED ) {

			console.log('[close]');

		} else {

			throw new Error( e.data );
		}

		var socket = e.currentTarget;

		socket.close();

		logout();
	}

	// function checkProtocol(){

	//	var link = document.createElement('a');
	//	link.href = config.socketConfig.server;

	//	return link.protocol;
	// }


	/**
	 *  [send description]
	 *
	 *  Sending messages throug the appropriate transport socket.
	 *
	 *  @param  {[type]} msg [description]
	 *  @return {[type]}     [description]
	 */

	function send ( msg, next )  {

		msg = JSON.stringify( msg );

		if ( config.socketConfig.server.split(':')[0] === 'http' ) { // XHR

			req( msg, next );

		} else {	// WS

			socketQueue.add( next );

			socket.send( msg );
		}
	}


	return {

		init	: init,
		send	: send,
		handle	: handleMessage
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


	// var media = false;

	var Connection = function ( local, remote, initiator, transport ) {

		this.info = {

			local	: local,
			remote	: remote,
			pending	: true
		};

		if ( initiator ) this.info.initiator = true;
		if ( transport ) this.info.transport = transport;

		this.channels = {};

		this.init();
	};


	Connection.prototype.init = function(){

		this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

		this.checkStateChanges();

		this.receiveDataChannels();

		this.findICECandidates();

		if ( this.info.initiator ) {

			this.createOffer();
		}
	};


	Connection.prototype.checkStateChanges = function(){

		var conn	= this.conn;

		conn.onstatechange = function ( e ) {
		// conn.onsignalingstatechange = function ( e ) {

			// console.log('[state changed]');

			// var state = e.currentTarget.signalingState;
			// if ( state === 'stable' ) {
			//	console.log('stable');
			// }
			// console.log(state);


			// will be leeverae over the state change - refering callbacks 1 !

			// console.log(conn);
			// console.log(conn.onconnecting);
			// console.log(conn.onopen);

			// connection.onconnecting = onSessionConnecting;
			// connection.onopen = onSessionOpen;
			//
			// ToDo: closing state could perhaps be used to clean up, not relying on datachannel itself
			//		but the missing peer connection !
			//
			//// pass
			//
			//-- error
			//-- open
			//-- close...


		};

		var length	= Object.keys( defaultHandlers ).length;

		conn.onnegotiationneeded = function ( e ) {

			// console.log('[negotiation needed]');

			if ( !--length ) {

				this.createOffer();
			}

		}.bind(this);


		conn.onicechange = function ( e ) {
		// conn.oniceconnectionstatechange = function ( e ) {
			// console.log('[ice changed]');
			// console.log(e);
		};

	};


	// receive remote created channel
	Connection.prototype.receiveDataChannels = function(){

		this.conn.ondatachannel = function ( e ) {

			var channel = e.channel,

				label = channel.label;

			this.channels[ label ] = new Handler( channel, this.info.remote );

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

	// perhaps ease on clean up later, just ensure simplier handler, check
	// http://html5videoguide.net/presentations/LCA_2013_webrtc/#page21

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


	Connection.prototype.createOffer = function() {

		var conn = this.conn;

		conn.createOffer( function ( offer ) {

			offer.sdp = adjustSDP( offer.sdp );

			conn.setLocalDescription( offer, function(){

				this.send({ action: 'setConfigurations', data: offer });

			}.bind(this) );

		}.bind(this), loggerr );	// 3.param || media contrain
	};


	// exchange settings
	Connection.prototype.setConfigurations = function ( msg ) {

		// console.log('[SDP] - ' +  msg.type );	// description

		var conn = this.conn,

			desc = new RTCSessionDescription( msg );


		conn.setRemoteDescription( desc, function(){

			if ( this._candidates ) this.setIceCandidates( this._candidates );

			if ( msg.type === 'offer' ) {

				conn.createAnswer( function ( answer ) {

					answer.sdp = adjustSDP( answer.sdp );

					conn.setLocalDescription( answer, function(){

						this.send({ action: 'setConfigurations', data: answer });

					}.bind(this), loggerr );

				}.bind(this), null, config.mediaConstraints );

			} else {

				createDefaultChannels( this );
			}

		}.bind(this), loggerr );
	};


	Connection.prototype.createDataChannel = function ( label, options ) {

		try {

			var channel = this.conn.createDataChannel( label, moz ? {} : { reliable: false });

			this.channels[ label ] = new Handler( channel, this.info.remote );

		} catch ( e ) {	// getting: a "NotSupportedError" - but is working !

			console.log('[Error] - Creating DataChannel (*)');
		}
	};


	// messed up, as already assigned to the id , cant be used for inital messaging !

	Connection.prototype.send = function ( channel, msg ) {

		if ( !msg ) {

			msg = channel; channel = null;
		}

		if ( !this.info.pending ) {		// established set through defaultHandler

			this.send = function useChannels ( channel, msg ) {

				var channels = this.channels;

				if ( !channel ) channel = keys = Object.keys( channels );

				if ( !Array.isArray( channel ) ) channel = [ channel ];

				// ToDo: closing issue
				// missing - message will be send - injected as , new icecandidates will be created etc.

				for ( var i = 0, l = channel.length; i < l; i++ ) {

					// try {

					if ( channels[ channel[i] ] ) channels[ channel[i] ].send( msg );

					// } catch ( err ) {
						// console.log(channel);
						// console.log(msg);
					// }
				}

			}.bind(this);

			this.send( channel, msg );

		} else { // initializing handshake

			msg.local = this.info.local,
			msg.remote = this.info.remote;

			// mesh work	// this.transport -> the connection ||	delegates to the call aboe !
			if ( this.info.transport ) {

				this.info.transport.send( 'register', msg );

			} else {

				socket.send( msg );
			}
		}
	};


	Connection.prototype.close = function( channel ) {

		var channels = this.channels,
			keys = Object.keys(channels);

		if ( !channel ) channel = keys;

		if ( !Array.isArray( channel ) ) {

			channel = [ channel ];
		}

		for ( var i = 0, l = channel.length; i < l; i++ ) {

			channels[ channel[i] ].close();
			delete channels[ channel[i] ];
		}
	};

	// @Sharefest
	// modifying the SDP parameters for interoperability and bandwidth
	function adjustSDP ( sdp ) {

		// crypto
		if ( !~sdp.indexOf('a=crypto') ) {

			var crypto = [], length = 4;

			while ( length-- ) crypto.push( utils.getToken() );

			sdp += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:' + crypto.join('') + '\r\n';
		}

		// bandwidth
		if ( ~sdp.indexOf('b=AS') ) {

			sdp = sdp.replace( /b=AS:([0-9]*)/, function ( match, text ) {

				var size = config.channelConfig.BANDWIDTH;

				return 'b=AS:' + size;
			});
		}

		return sdp;
	}


	// create basic channels
	function createDefaultChannels ( connection )  {

		if ( Object.keys(connection.channels).length ) return;

		var defaultChannels = Object.keys( defaultHandlers );

		for ( var i = 0, l = defaultChannels.length; i < l ; i++ ) {

			connection.createDataChannel( defaultChannels[i] );
		}
	}

	return Connection;

})();

/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */

var Peer = (function(){

	'use strict';

	var Peer = function ( data ) {

		this.init( data );
	};


	utils.inherits( Peer, Emitter );


	Peer.prototype.init = function ( data ) {

		Emitter.call( this );

		this.id			= data.id			|| null;

		this.name		= data.name			|| null;
	};


	return Peer;

})();

/**
 *  Player
 *  ======
 *
 *  Interface for the player - will extend the peer wrapper.
 *  // A wrapper for a Peer/Node. Using singleton pattern.
 */


pg.Player = function ( name ) {

	'use strict';

	var Player = (function(){


		var Player = function ( name ) {

			var data = {

				id		: utils.createUID(),
				name	: name
			};

			this.init( data );

			this.connections = {};


			console.log('\n\t\t:: ' + this.id + ' ::\n');


			var register = function(){

				socket.init( this.id, function ( remoteID ) {

					if ( remoteID ) {

						this.checkNewConnections([ remoteID ]);

					} else {

						// this.stores.global = new DHT( pg.config.dht );
					}

				}.bind(this));

			}.bind(this);

			if ( socketQueue.ready ) {

				register();

			} else {

				socketQueue.add( register );
			}
		};


		utils.inherits( Player, Peer );


		Player.prototype.checkNewConnections = function ( list, transport ) {

			var connections = this.connections,
				localID = this.id,
				remoteID;

			for ( var i = 0, l = list.length; i < l; i++ ) {

				remoteID = list[i];

				if ( remoteID !== localID && !connections[ remoteID ] ) {

					this.connect( remoteID, true, transport );
				}
			}
		};


		// perhaps hide interfaces, include the check new connections into the 'instance.connect' ?
		Player.prototype.connect = function ( remoteID, initiator, transport ) {

			if ( this.connections[remoteID] ) return;	// as connection is force by the user

			// console.log( '[connect] to - "' + remoteID + '"' );

			var connection = new Connection( this.id, remoteID, initiator || false, transport );

			this.connections[ remoteID ] = connection;

			pg.peers[ remoteID ] = new Peer({ id: remoteID, connection: connection });
		};


		Player.prototype.send = function ( channel, msg ) {

			if ( !msg ) {

				msg = channel;
				channel = null;
			}

			if ( !channel ) channel = [ 'message' ];

			if ( !Array.isArray( channel ) ) channel = [ channel ];

			var connections = this.connections,
				keys = Object.keys( connections ),
				conn, i, l, n, k;

			for ( i = 0, l = keys.length; i < l; i++ ) {

				conn = connections[ keys[i] ];

				for ( n = 0, k = channel.length; n < k; n++ ) {

					conn.send( channel, { local: this.name, msg: msg });
				}
			}
		};

		return Player;

	})();


	return instance || ( instance = new Player( name ) );
};



/**
 *  Login
 *  =====
 *
 *  can be used after handling authentication - wrapper to preset the Peer !
 */


pg.login = (function(){

	var login = function ( data, next ) {

		var name = data.name || data,

			player = pg.Player( name );

		next( player );
	};


	return login;

})();



	return pg;
});
