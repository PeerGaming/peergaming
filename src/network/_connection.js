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
