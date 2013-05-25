/**
 *  Connection
 *  ==========
 *
 *  A wrapper for PeerConnection.
 */


var Connection = function ( local, remote, initiator, transport ) {

  this.info = { local: local, remote: remote, pending: true };

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

  var conn    = this.conn,

      length  = Object.keys( defaultHandlers ).length;


  conn.onnegotiationneeded = function ( e ) {

    // console.log('[negotiation needed]');
    if ( !--length ) this.createOffer();

  }.bind(this);


  conn.oniceconnectionstatechange = function ( e ) {

    var iceState = e.currentTarget.iceConnectionState;

    // disconnected
    if ( iceState === 'disconnected' ) Manager.disconnect( this.info.remote );

  }.bind(this);


  conn.onsignalingstatechange = function ( e ) {

    // console.log('[state changed]');
    // var signalingState = e.currentTarget.signalingState;
    // console.log(signalingState);

  }.bind(this);
};


// receive remote created channel
Connection.prototype.receiveDataChannels = function(){

  this.conn.ondatachannel = function ( e ) {

    var channel = e.channel,

        label   = channel.label;

    this.channels[ label ] = new Handler( channel, this.info.remote );

  }.bind(this);
};


// find ICE candidates
Connection.prototype.findICECandidates = function(){

  this.conn.onicecandidate = function ( e ) {

    // var iceGatheringState = e.currentTarget.iceConnectionState;
    // console.log(iceGatheringState);

    // the 'null' candidate just because there isn't a onicegatheringcomplete event handler.
    if ( e.candidate ) {

      this.send( 'setIceCandidates', e.candidate );

    } else {

      // After ICE completion a callback with a null candidate is supplied.
      // console.log('iceGatheringState: completed');
    }

  }.bind(this);
};


// needs a description first !
Connection.prototype.setIceCandidates = function ( data ) {

  var conn = this.conn;

  if ( conn.remoteDescription || conn.localDescription ) {

    if ( this._candidates ) delete this._candidates;

    if ( !Array.isArray(data) ) data = [ data ];

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

  // initial setup channel for configuration
  if ( moz ) conn.createDataChannel('[moz]');

  conn.createOffer( function ( offer ) {

    offer.sdp = adjustSDP( offer.sdp );

    conn.setLocalDescription( offer, function(){

      this.send( 'setConfigurations', offer );

    }.bind(this) );

  }.bind(this), loggerr, config.mediaConstraints ); // 3.param || media contrain
};


// exchange settings
Connection.prototype.setConfigurations = function ( msg ) {

  // console.log('[SDP] - ' +  msg.type );  // description

  var conn = this.conn,

      desc = new RTCSessionDescription( msg );


  conn.setRemoteDescription( desc, function(){

    if ( this._candidates ) this.setIceCandidates( this._candidates );

    if ( msg.type === 'offer' ) {

      conn.createAnswer( function ( answer ) {

        answer.sdp = adjustSDP( answer.sdp );

        conn.setLocalDescription( answer, function(){

          this.send( 'setConfigurations', answer );

        }.bind(this), loggerr );//, config.SDPConstraints );

      }.bind(this), null, config.mediaConstraints );

    } else {

      createDefaultChannels( this );
    }

  }.bind(this), loggerr );
};


Connection.prototype.createDataChannel = function ( label, options ) {

  try {

    // var channel = this.conn.createDataChannel( label, moz ? {} : { reliable: false });
    var channel = this.conn.createDataChannel( label, { reliable: false });

    this.channels[ label ] = new Handler( channel, this.info.remote );

  } catch ( e ) { // getting: a "NotSupportedError" - but is working !

    console.log('[Error] - Creating DataChannel (*)');
  }
};



// internal reference
Connection.prototype.send = function ( action, data ) {  // msg

  // established set through defaultHandler
  if ( !this.info.pending ) {

    this.send = function useChannels ( channel, data, proxy ) {

      var msg = { action: channel, local: INSTANCE.id, data: data, remote: this.info.remote };

      utils.extend( msg, proxy );


      var channels = this.channels;

      if ( !channel ) channel = keys = Object.keys( channels );

      if ( !Array.isArray( channel ) ) channel = [ channel ];

      // ToDo: closing issue
      // missing - message will be send - injected as , new icecandidates will be created etc.

      for ( var i = 0, l = channel.length; i < l; i++ ) {

        if ( channels[ channel[i] ] ) channels[ channel[i] ].send( msg );
      }

    }.bind(this);


    this.send( action, data );

  } else { // initializing handshake


    var remote = this.info.remote;

    // mesh work
    if ( this.info.transport ) {

      var proxy = { action: action, local: INSTANCE.id, remote: remote };

      return this.info.transport.send( 'register', data, proxy );
    }

    // send via server
    socket.send({ action: action, data: data, remote: remote });
  }
};


// closing by dev
Connection.prototype.close = function( channel ) {

  var channels  = this.channels,
      keys      = Object.keys(channels);

  if ( !channel ) channel = keys;

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  for ( var i = 0, l = channel.length; i < l; i++ ) {

    channels[ channel[i] ].close();
    delete channels[ channel[i] ];
  }
};


// @Sharefest
// modifying the SDP parameters for interoperability and bandwidth
// + // See RFC for more info: http://www.ietf.org/rfc/rfc2327.txt
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

  // just once
  if ( Object.keys(connection.channels).length ) return;

  var defaultChannels = Object.keys( defaultHandlers );

  for ( var i = 0, l = defaultChannels.length; i < l ; i++ ) {

    connection.createDataChannel( defaultChannels[i] );
  }
}
