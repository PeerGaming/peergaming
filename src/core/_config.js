/**
 *  Config
 *  ======
 *
 *  Settinings & default configurations for the network.
 */


/**
 *  Public interface to set custom configurations
 *
 *  @type {Function} pg.config
 */




/**
 *  Optional callback for handling credential exchange
 *
 *  @type {Function} SERVERLESS
 */

var SERVERLESS = null;


/**
 *  Internal configurations
 *
 *  @type {Object} config
 */

var config = {


  /**
   *  Delay to ensure full candidate creation
   *
   *  Heuristics: [1] offer = 12  || answer = 6                  - for basic peerconnection
   *              [2] offer =  6  || answer = 0 (=> no new ones) - for data channel
   */

  initialDelay :     1200,   // 12 * 100ms


  /**
   *  DataChannel specific settings
   *
   *  @type {Object} channelConfig
   */

  channelConfig: {

    BANDWIDTH   : 0x100000,   // 1MB  - increase DataChannel capacity
    MAX_BYTES   :     1024,   // 1kb  - max data size before splitting
    CHUNK_SIZE  :      600    //      - size of the chunks
  },


  /**
   *  Settings for external transport channel
   *
   *  @type {Object} socketConfig
   */

  socketConfig: {

    server: 'ws://peergaming.net:61125'   // peergaming-server address
  },


  /**
   *  PeerConnection specific settings
   *
   *  @type {Object} peerConfig
   */

  peerConfig: {

    iceServers: [{

      url: !moz ? 'stun:stun.l.google.com:19302' :  // STUN server address
                  'stun:23.21.150.121'
    }]
  },


  /**
   *  Constraints for the SDP packages
   *
   *  @type {Object} connectionContrains
   */

  connectionConstraints: {

    optional: [{ RtpDataChannels: true }]  // enable DataChannel
  },


  /**
   *  Constrains for MediaStreams
   *
   *  @type {Object} mediaConstraints
   */

  mediaConstraints: {

    mandatory: {

      OfferToReceiveAudio   : true,
      OfferToReceiveVideo   : true
    },

    optional: []
  },


  /**
   *  Contstraints specific for video handling
   *
   *  @type {Object} videoConstrains
   */

  videoConstraints: {

    mandatory: {

      maxHeight : 320,  // default dimension for android
      maxWidth  : 240   //
    },

    optional: []
  }

};


/** Previous settings for Firefox **/

// if ( moz ) {

//   config.connectionConstraints = { optional: [{ DtlsSrtpKeyAgreement   : 'true' }] };
//   config.SDPConstraints        = { mandatory: { MozDontOfferDataChannel:  true  }  };
// }


/**
 *  Reference to extend the internal configurations
 *
 *  @param  {Object} customConfig   -
 *  @return {Object}
 */

function setConfig ( customConfig ) {

  extend( config, customConfig );

  return config;
}


/**
 *  Providing a callback to handle credentials manually
 *
 *  @param {Function} hook   -
 */

setConfig.noServer = function ( hook ) {

  if ( typeof hook === 'boolean' && hook ) return; // TODO: 0.6.0 -> useLocalDev();

  SERVERLESS = hook;
};
