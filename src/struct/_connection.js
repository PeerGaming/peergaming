/**
 *  Connection
 *  ==========
 *
 *  A wrapper for PeerConnection - including DataChannel setup.
 *
 *  http://dev.w3.org/2011/webrtc/editor/webrtc.html
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

  // internal: remote tracking
  this._candidates  =   [];
  this._fragments   =   {};

  // internal: local handling
  this._counter     =    0;
  this._sendSDP     = null;
};


/**
 *  Create connection and setup receiver
 */

Connection.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.connectionConfig, config.connectionConstraints );

  this.checkStateChanges();

  this.findICECandidates();

  if ( this instanceof DataConnection ) {

    this.channels = {};

    this.receiveDataChannels();

    if ( this.info.initiator ) {

      this.createOffer();
    }

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

    if ( signalingState === 'closed' ) {

      console.log('[CLOSED]');
      MANAGER.disconnect(this.info.remote);
    }

  }.bind(this);


  // TODO: minimize interuption , perhaps workaround - just on connecting ?
  conn.oniceconnectionstatechange = function ( e ) {

    var iceConnectionState = e.currentTarget.iceConnectionState;

    // console.log(iceConnectionState);
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
 *  Find and exchanges ICE candidates
 */

Connection.prototype.findICECandidates = function(){

  var conn      = this.conn,

      isRemote  = !this.info.initiator,

      track     = null;

  conn.onicecandidate = function ( e ) {

    var iceGatheringState = conn.iceGatheringState;

    if ( e.candidate ) { this._counter++; this.send( 'setIceCandidates', e.candidate ); }

    // some candidates got a 'complete state || FF => just 1x exchange with state "new"
    if ( (iceGatheringState === 'complete' && !e.candidate) || moz ) {

      if ( isRemote ) { // just consider the remote peer P2

        if ( track == void 0 ) {

          track = this._counter/2;

        } else if ( --track > 0 ) return;
      }

      invokeExchange.call( this );
    }

  }.bind(this);


  function invokeExchange(){

    var num = this._counter; this._counter = 0;

    if ( typeof this._sendSDP == 'function' ) return this._sendSDP(num);

    this._sendSDP = num; // signal to be ready
  }

};


/**
 *  Create an offer (called for PeerConnectio & DataChannel)
 */

Connection.prototype.createOffer = function() {

  var conn = this.conn;

  // FF doesn't support re-negiotiation -> requires the setup before
  if ( this instanceof DataConnection && moz ) createDefaultChannels( this );

  this._sendSDP = null;

  conn.createOffer( function ( offer ) {

    offer.sdp = adjustSDP( offer.sdp );

    // start generating ICE candidates
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
 *  Exchange settings and set the descriptions
 *
 *  @param {Object} msg   -
 */

Connection.prototype.setConfigurations = function ( msg ) {

  console.log( '[SDP] - ' +  msg.type );  // description

  var conn = this.conn,

      desc = new RTCSessionDescription( msg );


  if ( this.closed ) {

    msg = 'The underlying PeerConnection got closed too early...';

    WATCH.emit('error', {  msg: msg, line: 259 });

    alert('Sorry, but an error occoured. Please revisit the site!');

    throw new Error(msg);
  }

  // console.log( desc.sdp );

  // waiting for expected packages
  if ( this._candidates.length < this._fragments.candidates ) {

    return setTimeout( this.setConfigurations.bind(this), 1000, msg );
  }

  // Chrome -> FF: firefox doesn't trigger the description
  conn.setRemoteDescription( desc, function(){

    if ( this._candidates.length ) this.setIceCandidates( this._candidates, true );

    if ( msg.type === 'offer' ) {

      this._sendSDP = null;

      // FF -> Chrome: chrome doesn't create an answer
      conn.createAnswer( function ( answer ) {

        answer.sdp = adjustSDP( answer.sdp ); // complete, false

        conn.setLocalDescription( answer, function(){

          exchangeDescription.call( this, answer );

        }.bind(this), loggerr ); // config.SDPConstraints

      }.bind(this), loggerr, config.mediaConstraints );

    } else { // receive answer

      if ( this instanceof DataConnection ) {

        if ( moz ) return;

        createDefaultChannels( this );

      } else {

        console.log('[END] - TODO: MediaConnection cleanup + handlers'); // what now ?
      }
    }

  }.bind(this), !moz ? loggerr : function(){} ); // FF -> supress warning for missing re-negotiation

};


/**
 *  Closing DataChannels and PeerConnection
 *
 *  @param {String} channel   -
 */

Connection.prototype.close = function( channel ) {

  this.conn.close();
};


/**
 *  Modifying the SDP parameter for interoperability and bandwidth
 *  (see: RFC - http://tools.ietf.org/html/rfc4566 )
 *
 *  @param {Object} sdp   -
 */

function adjustSDP ( sdp ) {

  // crypto
  if ( sdp.indexOf('a=crypto') < 0 ) {

    var crypto = [], length = 4;

    while ( length-- ) crypto.push( getToken() );

    sdp += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:' + crypto.join('') + '\r\n';
  }

  // bandwidth
  if ( sdp.indexOf('b=AS') >= 0 ) {

    sdp = sdp.replace(/b=AS:([0-9]*)/, function ( match, text ) {

      return 'b=AS:' + config.handlerConfig.BANDWIDTH;
    });
  }

  if ( sdp.indexOf('a=mid:data') >= 0 ) {

    sdp = sdp.replace(/a=mid:data\r\n/g, function ( match, text ) {

      return 'a=mid:data\r\nb=AS:' + config.handlerConfig.BANDWIDTH + '\r\n';
    });
  }

  return sdp;
}


/**
 *  Sending the SDP package to your partner
 *
 *  @param  {[type]} description [description]
 */

function exchangeDescription ( desc ) {

  var ready = this._sendSDP;

  this._sendSDP = function ( num ) { // TODO: sometimes 3 x "offer" !?

    this.send( 'expectPackages', { type: 'candidates', size: num });

    this.send( 'setConfigurations', desc );

  }.bind(this);

  // trigger if gathering already happend (see P2 on re-negotioation != candidates)
  if ( ready != void 0 ) this._sendSDP( ready );
}
