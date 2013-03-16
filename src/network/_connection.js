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

