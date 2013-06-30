/**
 *  Config
 *  ======
 *
 *  Settinings & default configurations for the network.
 */



/**
 *  Internal configurations
 *
 *  @type {Object} config
 */

var config = {


  /**
   *  Settings for continue a former session
   *
   *  @type {Object} reconnectConfig
   */

  reconnectConfig: {

    restoreEnabled :          false, //         - disabled by default
    backupDuration : 30 * 60 * 1000  // 30 min  - duration to keep the local information (from start)
  },


  /**
   *  Handler attributes
   *
   *  @type {Object} handlerConfig
   */

  handlerConfig: {

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

  connectionConfig: {

    'iceServers': [{

      url      : !moz ? 'stun:stun.l.google.com:19302' :  // STUN server address
                        'stun:23.21.150.121',
      username : null,
      password : null
    }]
  },


  /**
   *  Constraints for the PeerConnection & SDP packages
   *
   *  @type {Object} connectionContrains
   */

  connectionConstraints: {

    'optional': [{ RtpDataChannels: true }]  // enable DataChannel
  },


  /**
   *  DataChannel specific settings
   */

  channelConfig: {

    reliable: false
    // outOfOrderAllowed: true,
    // maxRetransmitNum : 0
  },


  /**
   *  Constrains for MediaStreams
   *
   *  @type {Object} mediaConstraints
   */

  mediaConstraints: {

    'mandatory': {

      OfferToReceiveAudio   : true,
      OfferToReceiveVideo   : true
    },

    'optional': []
  },


  /**
   *  Contstraints specific for video handling
   *
   *  @type {Object} videoConstrains
   */

  videoConstraints: {

    'mandatory': {

      maxHeight : 320,  // default dimension for android
      maxWidth  : 240
    },

    'optional': [

      { minWidth:  640, minHeight: 480 },
      { minWidth: 1280, minHeight: 720 }
    ]
  }

};


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

  if ( typeof hook !== 'function' ) return;

  SERVERLESS = hook;
};


/**
 *  Enable local development, by using webstorage to exchange the credentials
 *
 */

setConfig.localDev = function(){ // TODO: 0.6.0 -> useLocalDev();

};
