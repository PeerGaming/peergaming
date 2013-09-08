/**
 *  Config
 *  ======
 *
 *  Settings & default configurations for the network.
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
   *  Settings for synchronization
   *
   *  @type {Object} synchronConfig
   */

  synchronConfig: {

    naiveSync: false // if use naiveSync - faster but not reliable, as used for signaling
                     // used with pg.on('sync', function ( key, value ) { })
  },


  /**
   *  Handler attributes
   *
   *  Changing the bandwith default, which is throttled to a speed limitation of 30kb/s.
   *  Also defines defines a max byte size, as it will just send messages of 1280bytes.
   *
   *  See: https://code.google.com/p/chromium/codesearch#chromium/src/third_party/libjingle/source/
   *       talk/media/sctp/sctpdataengine.cc&l=52
   *
   *
   *  @type {Object} handlerConfig
   */

  handlerConfig: {

    BANDWIDTH   : 0x100000,   // 1MB  - increase DataChannel capacity
    MAX_BYTES   :     1200,   // 1kb  - max data size before splitting
    CHUNK_SIZE  :      800    //      - size of the chunks
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

    'iceServers': [

      // STUN server = address - e.g. Google
      {
        url : chrome ? 'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
      },

      // TURN server = relay - e.g. Numb (Viagenie)
      {
        url        : 'turn:numb.viagenie.ca',
        username   : 'demo@peergaming.net',
        credential : 'demo'
      }
    ]
  },


  /**
   *  Constraints for the PeerConnection & SDP packages
   *
   *  @type {Object} connectionContrains
   */

  connectionConstraints: {

    'optional': [

      { RtpDataChannels: true }            // enable DataChannel
      // { DtlsSrtpKeyAgreement: true }    // using SRTP (Chrome - Firefox)
    ]
  },


  /**
   *  DataChannel specific settings
   */

  channelConfig: {

    reliable: true, // false
    // outOfOrderAllowed: true,
    // maxRetransmitNum : 0
  },


  /**
   *  Constrains for MediaStreams
   *
   *  @type {Object} mediaConstraints
   */

  permissions: {

    audio: true
    // video: true
  },

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

  extend( config, { connectionConfig: { 'iceServers': [] } });

  SERVERLESS = hook;
};


/**
 *  Enable local development, by using webstorage to exchange the credentials
 *
 */

setConfig.localDev = function ( num ) { // TODO: 0.6.0 -> useLocalDev();

  if ( typeof num !== 'number' ) num = parseFloat( num );

  if ( isNaN(num) ) num = 1;

  // the number defines how many split views should be open (reduced to keep them square)
  //
  // 1 -> normal, just this window (user will open another window by himself)
  //
  // 2 -> split into half, both got half width etc. and exchange

  // // if one closes or reloads -> the parent windows will be closes as well ! (so that a refresh can
  // happen right away !)

};
