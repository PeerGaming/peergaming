/**
 *  Config
 *  ======
 *
 *  Default configurations for the network.
 */


var config = {

  channelConfig: {

    BANDWIDTH   : 0x100000,   // 1MB     // prev:  1638400 || 1600 - increase DataChannel width

    MAX_BYTES   :     1024,   // 1kb     // max bytes throughput of a DataChannel
    CHUNK_SIZE  :      600               // size of the chunks - in which the data will be splitt
  },


  socketConfig: {

    server: 'ws://peergaming.dev:61125'   // bootstrapping server address || localhost || net
  },


  peerConfig: {

    iceServers: [{

      url: !moz ? 'stun:stun.l.google.com:19302' :  // address for STUN / ICE server
                  'stun:23.21.150.121'
    }]
  },


  connectionConstraints: {

    optional: [{ RtpDataChannels: true }]         // enable DataChannel
  },

// Requested access to local media with mediaConstraints:
//   "{"optional":[],"mandatory":{}}"


  mediaConstraints: {

    mandatory: {                    // required permissions

      OfferToReceiveAudio   : true,
      OfferToReceiveVideo   : true
    },

    optional: []
  },

  videoConstraints: {              // e.g. android

    mandatory: {

      maxHeight : 320,
      maxWidth  : 240
    },

    optional: []
  }

};

// if ( moz ) {

  // config.connectionConstraints = { optional: [{ DtlsSrtpKeyAgreement: 'true' }] };
  // config.SDPConstraints    = { mandatory: { MozDontOfferDataChannel: true } };
// }


/**
 *  [config description]
 *  @param  {[type]} customConfig [description]
 *  @return {[type]}              [description]
 */

pg.config = function ( customConfig ) {

  utils.extend( config, customConfig );

  return config;
};


// servers = {"iceServers":[
//                 {"url":"stun:<stun_server>:<port>},
//                 { url: "turn:<user>@<turn_server>:<port>",credential:"<password>"}
//             ]};

// but when I check
