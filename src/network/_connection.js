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

  this.channels     =   {};

  // internal: remote tracking
  this._candidates  =   [];
  this._fragments   =   {};

  // internal: local handling
  this._counter     =    0;
  this._sendSDP = null;

  this.init();
};


/**
 *  Create connection and setup receiver
 */

Connection.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.connectionConfig, config.connectionConstraints );

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

      length  = getKeys( defaultHandlers ).length;


  conn.onnegotiationneeded = function ( e ) {

    if ( !--length ) this.createOffer();

  }.bind(this);


  conn.onsignalingstatechange = function ( e ) {

    var signalingState = conn.signalingState;

    this.ready = ( signalingState === 'stable' );
    // if ( signalingState === 'closed' ) MANAGER.disconnect(this.info.remote);

  }.bind(this);


  conn.oniceconnectionstatechange = function ( e ) {

    var iceConnectionState = e.currentTarget.iceConnectionState;

    if ( iceConnectionState === 'disconnected' ) {

      if ( this.info.pending ) { // interrupt

        this.closed = true;

      } else { // cleanup closed connection

        MANAGER.disconnect( this.info.remote );
      }

    }

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

  var conn     = this.conn,

      length   = getKeys( defaultHandlers ).length - 1,

      advanced = false;


  // remote just invokes half
  if ( !this.info.initiator ) length = ~~( length/2 );

  conn.onicecandidate = function ( e ) {

    var iceGatheringState = conn.iceGatheringState;

    // if ( moz && advanced ) return;

    if ( e.candidate ) { this._counter++; this.send( 'setIceCandidates', e.candidate ); }

    // for DataChannel - some are still "gathering", not "complete"
    if ( advanced ) { if ( !--length ) invokeExchange.call( this ); return; }

    // FF => just 1x exchange with state "new"
    if ( iceGatheringState === 'complete' || moz ) {

      advanced = true;

      invokeExchange.call( this );
    }

  }.bind(this);


  function invokeExchange(){

    var num = this._counter; this._counter = 0;

    if ( this._sendSDP ) return this._sendSDP(num);

    this._sendSDP = num; // signal to be ready
  }

};


/**
 *  Set the ICE candidates - using an additional container internaly to keep the order
 *
 *  @param {Object} data [description]
 */

Connection.prototype.setIceCandidates = function ( data, release ) {

  if ( this.closed ) throw new Error('Can\'t set ICE candidates!');

  if ( !release ) return this._candidates.push( data );

  var conn = this.conn,

      l    = data.length;

  for ( var i = 0; i < l; i++ ) conn.addIceCandidate( new RTCIceCandidate( data[i] ) );

  data.length = 0;

  delete this._fragments.candidates;
};


/**
 *  Create an offer (called for PeerConnectio & DataChannel)
 */

Connection.prototype.createOffer = function() {

  var conn = this.conn;

  // FF doesn't support re-negiotiation and requires the setup before
  if ( moz ) createDefaultChannels( this );

  this._sendSDP = null;

  // starts generating ICE candidates
  conn.createOffer( function ( offer ) {

    offer.sdp = adjustSDP( offer.sdp );

    conn.setLocalDescription( offer, function(){

      exchangeDescription.call( this, offer );

    }.bind(this), loggerr ); // config.SDPConstraints

  }.bind(this), loggerr, config.mediaConstraints );
};


/**
 *  Declare the amount of packages which are
 *
 *  @param  {[type]} msg [description]
 *  @return {[type]}     [description]
 */

Connection.prototype.expectPackages = function ( msg ) {

  this._fragments[ msg.type ] = msg.size;
};


/**
 *  Exchange settings and set the descriptions
 *
 *  @param {Object} msg   -
 */

Connection.prototype.setConfigurations = function ( msg ) {

  // console.log( '[SDP] - ' +  msg.type );  // description

  var conn = this.conn,

      desc = new RTCSessionDescription( msg );


  if ( this.closed ) throw new Error('Underlying PeerConnection got closed too early!');


  if ( this._candidates.length < this._fragments.candidates ) {

    return setTimeout( this.setConfigurations.bind(this), 100, msg );
  }

  conn.setRemoteDescription( desc, function(){

    if ( this._candidates.length) this.setIceCandidates( this._candidates, true );

    this._sendSDP = null;

    if ( msg.type === 'offer' ) {

      conn.createAnswer( function ( answer ) {

        answer.sdp = adjustSDP( answer.sdp );

        conn.setLocalDescription( answer, function(){

          exchangeDescription.call( this, answer );

        }.bind(this), loggerr ); // config.SDPConstraints

      }.bind(this), null, config.mediaConstraints );

    } else { // receive answer

      if ( moz ) return;

      createDefaultChannels( this );
    }

  }.bind(this), !moz ? loggerr : function(){} ); // FF -> supress warning for missing re-negotiation

};


/**
 *  Creates a handler for the DataChannel
 *
 *  @param {String} label     -
 *  @param {Object} options   -
 */

Connection.prototype.createDataChannel = function ( label ) {

  try {

    // TODO: FF crashes on creation
    var channel = this.conn.createDataChannel( label, moz ? {} : { reliable: false });

    this.channels[ label ] = new Handler( channel, this.info.remote );

  } catch ( e ) { // getting a "NotSupportedError" - but is working !

    console.warn('[Error] - Creating DataChannel (*)');
  }
};


/**
 *  Select the messeneger for communication & transfer
 *
 *  @param {String}  action   -
 *  @param {Object}  data     -
 *  @param {Boolean} direct   - defines if the action should only be execute via a direct connection
 */

Connection.prototype.send = function ( action, data, direct ) {

  if ( !this.info.pending ) {

    this.send = useChannels.bind(this);

    this.send( action, data );

  } else {

    if ( direct ) return;

    var remote = this.info.remote;

    if ( this.info.transport ) {

      var proxy = { action: action, local: PLAYER.id, remote: remote };

      return this.info.transport.send( 'register', data, proxy );
    }

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
      keys     = getKeys( handler );

  if ( !channel ) channel = keys;

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  for ( var i = 0, l = channel.length; i < l; i++ ) {

    handler[ channel[i] ].channel.close();
    delete handler[ channel[i] ];
  }

  if ( !getKeys( handler ).length ) this.conn.close();
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
 *  Sending the SDP package to your partner
 *
 *  @param  {[type]} description [description]
 */

function exchangeDescription ( description ) {

  var ready = this._sendSDP;

  this._sendSDP = function ( num ) {

    this.send( 'expectPackages', { type: 'candidates', size: num });

    this.send( 'setConfigurations', description );

  }.bind(this);

  // on second exchange, the remote doesn't set any candidates and the ready/num will be 0
  if ( ready !== void 0 ) this._sendSDP( ready );
}


/**
 *  Create basic DataChannel setup
 *
 *  @param {Object} connection   - reference to this connection
 */

function createDefaultChannels ( connection )  {

  if ( getKeys(connection.channels).length ) return;

  var defaultChannels = getKeys( defaultHandlers );

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

  if ( !channel ) channel = getKeys( channels );

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  for ( var i = 0, l = channel.length; i < l; i++ ) {

    if ( ready && channels[ channel[i] ] ) channels[ channel[i] ].send( msg );
  }
}
