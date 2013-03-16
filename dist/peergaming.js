/**
 *	peergaming.js - v0.1.7 | 2013-03-16
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

	features = [ 'URL', 'Blob', 'indexedDB', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

	if ( !(features[i] in win ) ) console.log( 'Missing: ', features[i] );
}

if ( !win.RTCPeerConnection ) throw new Error('Your browser doesn\'t support PeerConnections yet.');

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


/**
 *	Base
 *	====
 *
 *	Basic wrapper definitions.
 */

var pg = function(){};

pg.VERSION = '0.1.7';


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
 *  Misc
 *  ====
 *
 *  Collection of simple helpers.
 */


var utils = {};


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


// ToDo: inheritage - extending protype, e.g. player gets init of peer
utils.inherits = function inherits ( child, parent ) {

	child.prototype = Object.create( parent.prototype );
};



// see @broofa:
// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523

// ToDo: Use a timestemp for ID calculation ?

utils.createUID = function createUID(){

	var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});

	return id;
};

/**
 *	Event
 *	=====
 *
 *	Message handling using a Mediator (publish/subscribe).
 */

utils.extend( utils, function(){

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
	 *
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


	return Queue;

})();



/**
 *	Default
 *	=======
 *
 *	Default configurations for the network.
 */


var config = {

	channelConfig: {

		MAX_BYTES	: 1024,					// max bytes throughput of a DataChannel
		CHUNK_SIZE	:  600,					// size of the chunks - in which the data will be splitt
		CHUNK_DELAY	:  400					// time to delay sending chunks through a channel
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

		optional: [],

		mandatory: {										// required permissions

			OfferToReceiveAudio		: true,
			OfferToReceiveVideo		: true
		}
	}

};

if ( moz ) {

	config.mediaConstraints.mandatory.MozDontOfferDataChannel		= true;
	config.connectionConstraints.optional[0].DtlsSrtpKeyAgreement	= true;
}

/**
 *  Handler
 *  =======
 *
 *  Delegating through error - close, messaging events. // // handler for a new channel
 */


var Handler = (function(){

	var Handler = function ( remoteID, options ) {

		this.remoteID = remoteID;

		this.connection = instance.connections[this.remoteID];

		if ( options ) {

			if ( !options.message ) {

				options = { message: options };
			}

			var keys = Object.keys( options );

			for ( var i = 0, l = keys.length; i < l; i++ ){

				this[ '_' + keys[i] ] = options[ keys[i] ];
			}
		}
	};

	Handler.prototype.open = function ( e ) {

		var channel	= e.currentTarget;

		this.name = channel.label;

		// console.log('[open] - '  +this.name);

		//channel.binaryType = 'arraybuffer'; // 'blob'

		channel.addEventListener( 'message',	this.message.bind(this) );
		channel.addEventListener( 'close',		this.close.bind(this)	);
		channel.addEventListener( 'error',		this.error.bind(this)	);

		this.connection.channels[this.name] = channel;

		if ( this._open ) this._open.call( this.connection, e );
	};

	Handler.prototype.message = function ( e ) {

		// console.log('[message]');
		// console.log(e);

		if ( this._message ) this._message.call( this.connection, e );
	};

	Handler.prototype.error = function ( e ) {

		console.log('[channel - error]');
		// console.log(e);

		if ( this._error ) this._error.call( this.connection, e );
	};

	Handler.prototype.close = function(){

		console.log('[channel - closed]');
		// console.log(e);

		if ( this._close ) this._close.call( this.connection, e );
	};


	return Handler;

})();


// ToDo: check with resending + intevals ?


// timer stored on the front as well !
// if ( buffer[id] && buffer[id].timer ) {

//	clearInterval( buffer[id].timer );
// }

// if ( msg.clear ) {	// end PC1

//	delete buffer[id];
//	return;
// }


// if ( msg.part && !msg.data ) {					// sending chunk

//	part = msg.part;

//	console.log('[send chunk] - || ' + part );

//	timer = setInterval(function(){

//		channel.send( JSON.stringify({ id: id, data: buffer[id].chunks[part], part: part }) );

//	}, config.channelConfig.CHUNK_TIMER );

//	buffer[id].timer = timer;

//	channel.send( JSON.stringify({ id: id, data: buffer[id].chunks[part], part: part }) );//buffer[id].pop() }) );

//	return;
// }


// if ( !buffer[id] ) {								// first declaration || new chunks

//	console.log( '[new chunk] - || ' + msg.size );

//	buffer[id] = { size: msg.size, timer: null, chunks: [] };



//	part = buffer[id].chunks.length;

//	console.log('[request chunk] - || ' + part );


//	timer = setInterval(function(){

//		channel.send( JSON.stringify({ id: id, part: part }) );

//	}, config.channelConfig.CHUNK_TIMER );

//	buffer[id].timer = timer;


//	channel.send( JSON.stringify({ id: id, part: part }) );

//	return;
// }


// console.log(msg.part, buffer[id].chunks.length, buffer[id].chunks );


// // previous one
// if ( msg.part < buffer[id].chunks.length ) return;


// buffer[id].chunks[ msg.part ] = msg.data;


// // request
// if ( buffer[id].chunks.length !== buffer[id].size ) {

//	part = buffer[id].chunks.length;

//	console.log('[request chunk] - || ' + part );

//	timer = setInterval(function(){

//		channel.send( JSON.stringify({ id: id, part: part }) );

//	}, config.channelConfig.CHUNK_TIMER );

//	buffer[id].timer = timer;

//	channel.send( JSON.stringify({ id: id, part: part }) );

// // build
// } else {

//	channel.send( JSON.stringify({ id: id, clear: true }) );


//	console.log('[build chunk]');

//	msg = JSON.parse( buffer[id].chunks.join('')  );

//	delete buffer[id];

//	console.log(msg);
//	// return;

//	if ( customHandlers[msg.action] ) {

//		customHandlers[msg.action]( msg.data );

//	} else {

//		defaultHandlers.register({ data: JSON.stringify(msg) });
//	}
// }

/**
 *  Default
 *  =======
 *
 *  Default Handler for common task (e.g. estbalish mesh network).
 *  Context will be the on of the connection ? or like before from the handler ?
 */

// will be delegated throuhg / custom - in an 1:1 (2player - otherwise created via dsitribution etc.)

var customHandlers = {

	message: function ( msg, e ) {

		// console.log('message');

		console.log(msg);
	}
};


// buffer will be reused - Date.now() is ist as a simple key !
var buffer = {};


// socket.handle wird aufgesplitted -- // register can also then be attached to the socket !
var defaultHandlers = {

	// getInfos
	init: {

		open: function(){
			// console.log('[init - open]');
			// ToDo: receive remote information - can also be called by user to update etc.
			// this.getPeerInfo();			\\ or perhaps later on> shifting towards the player !
			// var data = instance.getInfo()

			var data = { name: instance.name, list: Object.keys(instance.connections)  };

			this.send('init', data );
		},

		message: function ( e ) {

			var msg = JSON.parse( e.data ),

				peer = pg.peers[ this.remoteID ];

			utils.extend( peer, { name: msg.name });

			instance.checkNewConnections( msg.list, this );

			utils.emit('connection', peer );
		}
	},


	chunk: function ( e ) {		// responding to itself...

		var msg		= JSON.parse( e.data ),
			channel	= this.channels['chunk'],
			id		= msg.id,
			part,
			timer;


		// na~ive		|| non reliable channels...

		if ( !msg.data && !msg.size ) {					// sending chunk

			// console.log('[send chunk] - || ' + buffer[id].length );

			setTimeout(function(){

				channel.send( JSON.stringify({ id: id, data: buffer[id].pop() }) );

			}, config.channelConfig.CHUNK_DELAY );


			return;
		}


		if ( !buffer[id] ) {								// first declaration || new chunks

			// console.log( '[new chunk] - || ' + msg.size );

			buffer[id] = { size: msg.size, chunks: [] };

			part = buffer[id].chunks.length;

			// console.log('[request chunk] - || ' + part );

			channel.send( JSON.stringify({ id: id, part: part }) );

			return;
		}


		buffer[id].chunks.push( msg.data );


		// request
		if ( buffer[id].chunks.length !== buffer[id].size ) {

			part = buffer[id].chunks.length;

			// console.log('[request chunk] - || ' + part );

			channel.send( JSON.stringify({ id: id, part: part }) );

		// build
		} else {

			// console.log('[build chunk]');
			// console.log(buffer[id].chunks);

			msg = buffer[id].chunks.join('');

			msg = JSON.parse(  msg );

			delete buffer[id];

			// console.log(msg);

			if ( customHandlers[msg.action] ) {

				customHandlers[msg.action]( msg.data );

			} else {

				defaultHandlers.register({ data: JSON.stringify(msg) });
			}
		}
	},


	register: function ( e ) {

		var msg = JSON.parse( e.data );

		if ( instance.connections[ msg.remote ] ) {	// proxy

			// just handler between - setting up for remote delegation
			// console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

			instance.connections[ msg.remote ].send( 'register', msg );

		} else if ( msg.remote === instance.id ) {	// gets the answers in return as well !

			// console.log(msg);

			if ( !instance.connections[ msg.local ] ) {

				instance.connect( msg.local, false, this );
			}

			instance.connections[ msg.local ][ msg.action ]( msg.data );
		}
	},


	delegate: function ( e ) {

		// console.log('[channel doesn\'t exist yet - local delegation');

		var msg = JSON.parse(e.data);
		// console.log(msg);

		if ( customHandlers[ msg.action ] ) {

			customHandlers[ msg.action ]( msg.data, e );
		}
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


	var media = false;

	var Connection = function ( localID, remoteID, initiator, transport ) {

		this.localID	= localID;
		this.remoteID	= remoteID;
		this.initiator	= initiator;
		this.transport	= transport;

		this.channels = {};

		this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

		if ( media ) {

			this.attachMediaStreams();

		} else {

			this.init();
		}
	};


	Connection.prototype.init = function(){

		if ( this.initiator ) {

			this.createOffer();
		}

		this.detectChanges();

		this.receiveDataChannels();

		this.findICECandidates();

		if ( this.SDP ) {

			this.setConfigurations( this.SDP );
			delete this.SDP;
		}
	};




	// SDP enhancemend
	Connection.prototype.attachMediaStreams = function(){

		var conn = this.conn;

		conn.onaddstream = function ( e ){

			console.log('[added stream]');

			// var video = document.createElement('video');
			// video.src = URL.createObjectURL( e.stream );
			// video.autoplay = true;

			// var box = document.createElement('div');
			// box.textContent = this.remoteID;
			// box.className = 'name';
			// box.appendChild(video);

			// document.body.appendChild( box );

		}.bind(this);

		conn.onremovestream = function ( e ) {

			console.log('[removed stream]');

			// document.getElementById('vid2').src = null;
			// URL.revokeObjectURL( e.stream );
		};

		// device access
		var permissions = { audio: true, video: true };

		navigator.getUserMedia( permissions, function ( stream ) {

			this.stream = stream;

			conn.addStream( stream );

			// document.getElementById('vid1').src = URL.createObjectURL(stream);

			// var videoTracks = stream.getVideoTracks(),
				// audioTracks = stream.getAudioTracks();

			this.init();

		}.bind(this));
	};


	Connection.prototype.detectChanges = function(){

		var conn	= this.conn,
			length	= Object.keys( defaultHandlers ).length;


		conn.onnegotiationneeded = function ( e ) {

			// console.log('[negotiation needed]');

			if ( !--length ) {

				this.createOffer();
			}

		}.bind(this);


		conn.onstatechange = function ( e ) {

			// console.log('[state changed]');
			// console.log(e);
		};


		conn.onicechange = function ( e ) {
			// console.log('[ice changed]');
			// console.log(e);
		};
	};


	Connection.prototype.receiveDataChannels = function(){

		// receive remote created channel
		this.conn.ondatachannel = function ( e ) {

			// console.log('[remote channel]');

			var channel = e.channel,

				name = channel.label,

				handler = new Handler( this.remoteID, defaultHandlers[ name ] );

			channel.onopen = handler.open.bind(handler);

		}.bind(this);
	};


	Connection.prototype.createDataChannel = function ( name, options ) {

		if ( options ) customHandlers[ name ] = options;

		try {

			var channel = this.conn.createDataChannel( name, moz ? {} : { reliable: false }),

				handler = new Handler( this.remoteID, defaultHandlers[ name ] );

			channel.onopen = handler.open.bind(handler);

		} catch ( e ) {	// getting: a "NotSupportedError" - but is working !

			console.log('[Error] - Creating DataChannel (*)');
			// console.log(e);
		}
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

		conn.createOffer( function ( offer ) {

			// console.log('[create offer]');

			conn.setLocalDescription( offer, function(){

				this.send({ action: 'setConfigurations', data: offer });

			}.bind(this));

		}.bind(this), loggerr );
	};


	// needs a description first !
	Connection.prototype.setIceCandidates = function ( data ) {

		var conn = this.conn;

		if ( conn.remoteDescription ) {//|| conn.localDescription ) {

			if ( this.test ) {

				if ( !this._candidates ) this._candidates = [];

				this._candidates.push( data );

				// console.log(this.test++);
				return;
			}


			this.test = 1;
			// ICE wird vor dem 2.offer gesetzt und ist evlt in kompatible
			// 10 candiadtes - just after received offer - answer...	// second offer !


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





	// exchange settings
	Connection.prototype.setConfigurations = function ( msg ) {

		// ensure stream
		if ( media && !this.stream ) {

			this.SDP = msg; return;
		}

		// console.log('[SDP] - ' +  msg.type );	// description

		var conn = this.conn,

			desc = new RTCSessionDescription( msg );

		conn.setRemoteDescription( desc, function(){

			delete this.test;
			if ( this._candidates ) this.setIceCandidates( this._candidates );

			if ( msg.type === 'offer' ) {

				conn.createAnswer( function ( answer ) {

					conn.setLocalDescription( answer, function(){

						this.send({ action: 'setConfigurations', data: answer });

					}.bind(this), loggerr );

				}.bind(this), null, config.mediaConstraints );

			} else {

				if ( this.created ) {

					delete this.created;
					return;
				}

				this.created = true;

				// console.log('[createDataChannel]');

				// establish the basic channels

				var defaultChannels = Object.keys( defaultHandlers );

				for ( var i = 0, l = defaultChannels.length; i < l ; i++ ) {

					this.createDataChannel( defaultChannels[i] );
				}
			}

		}.bind(this), loggerr );
	};


	Connection.prototype.send = function ( channel, msg ) {

		if ( !msg ) {

			msg = channel;
			channel = null;
		}

		var channels = this.channels,
			keys = Object.keys( channels );

		if ( keys.length ) {

			// match earlier - see socket stringify ?
			msg = JSON.stringify( msg );

			if ( msg.length < config.channelConfig.MAX_BYTES ) {

				if ( !channel ) channel = keys;

				if ( !Array.isArray( channel ) ) {

					channel = [ channel ];
				}

				for ( var i = 0, l = channel.length; i < l; i++ ) {

					channels[ channel[i] ].send( msg );
				}

			} else {	// too large

				chunkMessage.apply( this, [ channel, msg ] );
			}

		} else { // initializing handshake

			msg.local = this.localID,
			msg.remote = this.remoteID;

			// mesh work	// this.transport -> the connection ||	delegates to the call aboe !
			if ( this.transport ) {

				this.transport.send( 'register', msg );

			} else {

				socket.send( msg );
			}
		}
	};


	function chunkMessage ( channel, msg ) {

		var	maxBytes	= config.channelConfig.MAX_BYTES,
			chunkSize	= config.channelConfig.CHUNK_SIZE,
			size		= msg.length,
			chunks		= [];

		var start		= 0,
			end			= chunkSize;

		// console.log(JSON.parse(msg));

		while ( start < size ) {

			chunks.push( msg.slice( start, end ) );

			start = end;
			end = start + chunkSize;
		}

		// buffer - object (see default)

		// console.log( '[too large] - split: ' + size + ' || ' + chunks.length );

		var id = Date.now();

		// buffer[ id ] = { timer: null, chunks: chunks }; //.reverse() };
		buffer[ id ] = chunks.reverse();

		this.send( 'chunk', { id: id, size: chunks.length });
	}


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

	return Connection;

})();


/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */

pg.Peer = (function(){

	'use strict';

	var Peer = function ( data ) {

		this.init( data );
	};

	Peer.prototype.init = function ( data ) {

		this.id			= data.id			|| null;

		this.name		= data.name			|| null;

		this.connection	= data.connection	|| null;
	};

	return Peer;

})();

/**
 *  Player
 *  ======
 *
 *  Interface for the player - will extend the peer wrapper.
 */
// A wrapper for a Peer/Node. Using singleton pattern.

pg.Player = function ( name ) {

	'use strict';

	var Player = (function(){

		// custom settings overwrite default
		utils.extend( config, pg.config );


		var Player = function ( name ) {

			// inherits( this, pg.Peer );

			var data = {

				id		: utils.createUID(), //createID(),
				name	: name
			};

			// this.init( data );
			this.id		= data.id;
			this.name	= data.name;


			// player specific - as private
			this.stores = {};	// current layer= network (e.g. DHT for global)

			this.connections = {};

			// console.log('[Player] id - ' + this.id);
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


		Player.prototype.checkNewConnections = function ( list, transport ) {

			var connections = this.connections,
				localID = this.id,
				remoteID;

			for ( var i = 0, l = list.length; i < l; i++ ) {

				remoteID = list[i];

				if ( remoteID !== localID && !connections[ remoteID ] ) {

					instance.connect( remoteID, true, transport );
				}
			}
		};

		// perhaps hide interfaces, include the check new connections into the 'instance.connect' ?
		Player.prototype.connect = function ( remoteID, initiator, transport ) {

			if ( this.connections[remoteID] ) return;	// as connection is force by the user

			// console.log( '[connect] to - "' + remoteID + '"' );

			var connection = new Connection( this.id, remoteID, initiator || false, transport );

			this.connections[ remoteID ] = connection;

			pg.peers[ remoteID ] = new pg.Peer({ id: remoteID, connection: connection });
		};


		Player.prototype.on = utils.on;


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

					conn.send( 'delegate', { action: channel[n], data: msg });
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
