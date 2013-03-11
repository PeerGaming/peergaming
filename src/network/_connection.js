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




