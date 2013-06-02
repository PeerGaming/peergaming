/**
 *  Connection
 *  ==========
 *
 *  A wrapper for PeerConnection - including DataChannel setup.
 */


/**
 *  Constructor to setup up the basic information
 *
 *  @param {String}  local       -
 *  @param {String}  remote      -
 *  @param {Boolean} initiator   -
 *  @param {Object}  transport   -
 */

var Connection = function ( local, remote, initiator, transport ) {

  this.info = { local: local, remote: remote, pending: true };

  if ( initiator ) this.info.initiator = true;
  if ( transport ) this.info.transport = transport;

  this.channels = {};

  this.init();
};


/**
 *  Create connection and setup receiver
 */

Connection.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

  this.checkStateChanges();

  this.receiveDataChannels();

  this.findICECandidates();

  if ( this.info.initiator ) {

    this.createOffer();
  }
};


/**
 *  Setup for re-negotiation and statechange
 */

Connection.prototype.checkStateChanges = function(){

  var conn    = this.conn,

      length  = Object.keys( defaultHandlers ).length;


  conn.onnegotiationneeded = function ( e ) {

    if ( !--length ) this.createOffer();

  }.bind(this);


  conn.oniceconnectionstatechange = function ( e ) {

    var iceState = e.currentTarget.iceConnectionState;

    if ( iceState === 'disconnected' ) {

      if ( this.info.pending ) { // interrupt

        this.closed = true;

      } else { // cleanup closed connection

        MANAGER.disconnect( this.info.remote );
      }

    }

  }.bind(this);


  conn.onsignalingstatechange = function ( e ) {

    var signalingState = e.currentTarget.signalingState;

    this.ready = ( signalingState === 'stable' );

  }.bind(this);
};


/**
 *  Receive remotely create channel and sets up local handler
 */

Connection.prototype.receiveDataChannels = function(){

  this.conn.ondatachannel = function ( e ) {

    var channel = e.channel,

        label   = channel.label;

    this.channels[ label ] = new Handler( channel, this.info.remote );

  }.bind(this);
};


/**
 *  Find and exchanges ICE candidates
 */

Connection.prototype.findICECandidates = function(){

  this.conn.onicecandidate = function ( e ) {

    // var iceGatheringState = e.currentTarget.iceConnectionState;

    if ( e.candidate ) this.send( 'setIceCandidates', e.candidate );

  }.bind(this);
};


/**
 *  Sets ICE candidates - using an additional container to keep the order
 *
 *  @param {Object} data [description]
 */

Connection.prototype.setIceCandidates = function ( data ) {

  var conn = this.conn;

  if ( conn.remoteDescription || conn.localDescription ) {

    if ( this._candidates ) delete this._candidates;

    if ( !Array.isArray(data) ) data = [ data ];

    for ( var i = 0, l = data.length; i < l; i++ ) {

      // TODO: 0.5.0 -> Bug fixes
      // (DOM 12 exception error -> out of order)

      conn.addIceCandidate( new RTCIceCandidate( data[i] ) );
    }

  } else {

    if ( !this._candidates ) this._candidates = [];

    this._candidates.push( data );
  }
};


/**
 *  Create an offer
 */

Connection.prototype.createOffer = function() {

  var conn = this.conn;

  // initial setup channel for configuration
  if ( moz ) conn.createDataChannel('[moz]');

  conn.createOffer( function ( offer ) {

    offer.sdp = adjustSDP( offer.sdp );

    conn.setLocalDescription( offer, function(){

      this.send( 'setConfigurations', offer );

    }.bind(this), loggerr ); // config.SDPConstraints

  }.bind(this), loggerr, config.mediaConstraints );
};


/**
 *  Exchange settings and set the descriptions
 *
 *  @param {Object} msg   -
 */

Connection.prototype.setConfigurations = function ( msg ) {

  // console.log('[SDP] - ' +  msg.type );  // description

  var conn = this.conn,

      desc = new RTCSessionDescription( msg );


  // TODO: 0.5.0 -> Bug fixes
  if ( this.closed ) return alert('[ERROR] - Connection got interuppted. Please reload !');


  conn.setRemoteDescription( desc, function(){

    if ( this._candidates ) this.setIceCandidates( this._candidates );

    if ( msg.type === 'offer' ) {

      conn.createAnswer( function ( answer ) {

        answer.sdp = adjustSDP( answer.sdp );

        conn.setLocalDescription( answer, function(){

          this.send( 'setConfigurations', answer );

        }.bind(this), loggerr ); // config.SDPConstraints

      }.bind(this), null, config.mediaConstraints );

    } else {

      createDefaultChannels( this );
    }

  }.bind(this), loggerr );
};


/**
 *  Creates a handler for the DataChannel
 *
 *  @param {String} label     -
 *  @param {Object} options   -
 */

Connection.prototype.createDataChannel = function ( label, options ) {

  try {

    var channel = this.conn.createDataChannel( label, { reliable: false });

    this.channels[ label ] = new Handler( channel, this.info.remote );

  } catch ( e ) { // getting a "NotSupportedError" - but is working !

    console.log('[Error] - Creating DataChannel (*)');
  }
};


/**
 *  Select the messeneger for communication & transfer
 *
 *  @param {String} action   -
 *  @param {Object} data     -
 */

Connection.prototype.send = function ( action, data ) {

  if ( !this.info.pending ) {

    this.send = useChannels.bind(this);

    this.send( action, data );

  } else {

    var remote = this.info.remote;

    if ( this.info.transport ) {

      var proxy = { action: action, local: PLAYER.id, remote: remote };

      return this.info.transport.send( 'register', data, proxy );
    }

    if ( action === 'update' ) return console.log('[ERROR] - Update', data );

    SOCKET.send({ action: action, data: data, remote: remote });
  }
};


/**
 *  Closing DataChannels and PeerConnection
 *
 *  @param {String} channel   -
 */

Connection.prototype.close = function( channel ) {

  var handler  = this.channels,
      keys     = Object.keys( handler );

  if ( !channel ) channel = keys;

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  for ( var i = 0, l = channel.length; i < l; i++ ) {

    handler[ channel[i] ].channel.close();
    delete handler[ channel[i] ];
  }

  if ( !Object.keys( handler ).length ) this.conn.close();
};


/**
 *  Modifying the SDP parameter for interoperability and bandwidth
 *  (see: RFC - http://www.ietf.org/rfc/rfc2327.txt )
 *
 *  @param {Object} sdp   -
 */

function adjustSDP ( sdp ) {

  // crypto
  if ( !~sdp.indexOf('a=crypto') ) {

    var crypto = [], length = 4;

    while ( length-- ) crypto.push( getToken() );

    sdp += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:' + crypto.join('') + '\r\n';
  }

  // bandwidth
  if ( ~sdp.indexOf('b=AS') ) {

    sdp = sdp.replace( /b=AS:([0-9]*)/, function ( match, text ) {

      return 'b=AS:' + config.channelConfig.BANDWIDTH;
    });
  }

  return sdp;
}


/**
 *  Create basic DataChannel setup
 *
 *  @param {Object} connection   - reference to this connection
 */

function createDefaultChannels ( connection )  {

  if ( Object.keys(connection.channels).length ) return;

  var defaultChannels = Object.keys( defaultHandlers );

  for ( var i = 0, l = defaultChannels.length; i < l ; i++ ) {

    connection.createDataChannel( defaultChannels[i] );
  }
}


/**
 *  Replace previous socket usage with direct DataChannel connections
 *
 *  @param {String} channel   -
 *  @param {Object} data      -
 *  @param {Object} proxy     -
 */

function useChannels ( channel, data, proxy ) {

  var msg = { action: channel, local: PLAYER.id, data: data, remote: this.info.remote };

  extend( msg, proxy );

  var ready    = this.ready,
      channels = this.channels;

  if ( !channel ) channel = Object.keys( channels );

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  // TODO: 0.5.0 -> Bug fixes
  // if ( channel === 'register' || channel === 'start' ) console.log( channel, msg, proxy );

  for ( var i = 0, l = channel.length; i < l; i++ ) {

    if ( ready && channels[ channel[i] ] ) channels[ channel[i] ].send( msg );
  }
}
