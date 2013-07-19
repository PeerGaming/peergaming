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


  conn.oniceconnectionstatechange = function ( e ) {

    var iceConnectionState = e.currentTarget.iceConnectionState;

    // TODO: minimize interuption , perhaps workaround - just on connecting ?
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

  var conn     = this.conn,

      length   = 4,

      advanced = false;

  // TODO: hardcoded value, any reason behind this magic numbers ?
  // length   = ~~(( getKeys( defaultHandlers ).length - 1 ) / 2),
  if ( !this.info.initiator ) length--;

  conn.onicecandidate = function ( e ) {

    var iceGatheringState = conn.iceGatheringState;

    if ( e.candidate ) { this._counter++; this.send( 'setIceCandidates', e.candidate ); }

    // for DataChannel - some candidates are still "gathering", not "complete"
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

  if ( this instanceof DataConnection ) {

    // FF doesn't support re-negiotiation -> requires the setup before
    if ( moz ) createDefaultChannels( this );
  }

  this._sendSDP = null;

  // start generating ICE candidates
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


  if ( this.closed ) {

    msg = 'The underlying PeerConnection got closed too early...';

    WATCH.emit('error', {  msg: msg, line: 259 });

    alert('Sorry, but an error occoured. Please revisit the site!');

    throw new Error(msg);
  }

  // console.log( desc.sdp );

  if ( this._candidates.length < this._fragments.candidates ) {

    return setTimeout( this.setConfigurations.bind(this), 1000, msg );
  }

  conn.setRemoteDescription( desc, function(){  // Chrome -> FF: firefox doesn't trigger the description

    if ( this._candidates.length ) this.setIceCandidates( this._candidates, true );

    this._sendSDP = null;

    if ( msg.type === 'offer' ) {

      conn.createAnswer( function ( answer ) {  // FF -> Chrome: chrome doesn't create an answer

        answer.sdp = adjustSDP( answer.sdp );

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
 *  (see: RFC - http://www.ietf.org/rfc/rfc2327.txt )
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

  var ready = this._sendSDP; // amount of candidates to expect // improve naming of the variables...

  this._sendSDP = function ( num ) {

    this.send( 'expectPackages', { type: 'candidates', size: num });

    this.send( 'setConfigurations', desc );

  }.bind(this);

  // the remote doesn't set any candidates (ready/num will be 0) on the 2nd exchange + default (null)
  if ( ready != void 0 ) this._sendSDP( ready );
}
