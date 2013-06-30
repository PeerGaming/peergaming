/**
 *	peergaming.js - v0.4.7 | 2013-06-30
 *	http://peergaming.net
 *	Copyright (c) 2013, Stefan Dühring
 *	MIT License
 */

;(function ( name, context, definition ) {

	if ( typeof module !== 'undefined' ) {

		module.exports = definition( context );

	} else if ( typeof define !== 'undefined' ) {

		define( name, function(){ return definition( context ); });

	} else {

		context[name] = definition( context );
	}

})( 'pg', this, function ( context, undefined ) {

/**
 *  Constants
 *  =========
 *
 *  Internal references for faster access.
 */


/** global **/

var win     = window,
    doc     = document,
    nav     = win.navigator,

    moz     = nav.mozGetUserMedia ? parseFloat( nav.userAgent.match(/Firefox\/([0-9]+)\./).pop()       )
                                  : false,

    chrome  = win.chrome          ? parseFloat( nav.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./).pop() )
                                  : false,

    SESSION = win.sessionStorage,
    LOCAL   = win.localStorage;


/** native **/

var getKeys = Object.keys;


/** internal  **/

var ROOM        = '',        // current room
    QUEUE       = [],        // list to store async function calls
    CONNECTIONS = {},        // datachannel for each peer
    MEDIAS      = {},        // mediastreams for each peer
    SOCKET      = null,      // client-server transport
    MANAGER     = null,      // delegation methods
    INGAME      = false,     // information about the current state
    SERVERLESS  = null,      // optional callback for manual handling
    BACKUP      = {};        // store player data for reconnection


/** references **/

var VERSION     = null,      // pg.VERSION
    INFO        =   {},      // pg.info
    PLAYER      = null,      // pg.player
    PEERS       =   {},      // pg.peers
    DATA        =   [],      // pg.data
    SYNC        = null;      // pg.sync

/**
 *  Adapter
 *  =======
 *
 *  Normalize different browser behavior - using prefixes and workarounds.
 */


/** Performance **/

if ( !win.performance ) {

  win.performance = { now: Date().now() };

} else if ( !win.performance.now ) {

  win.performance.now = win.performance.webkitNow;
}


/** requestAnimationFrame **/

if ( !win.requestAnimationFrame ) {

  var vendors = [ 'webkit', 'moz' ];

  for ( var i = 0, l = vendors.length; i < l && !win.requestAnimationFrame; i++ ) {

    win.requestAnimationFrame = win[ vendors[i] + 'RequestAnimationFrame' ];
    win.cancelAnimationFrame  = win[ vendors[i] + 'CancelAnimationFrame' ]        ||
                                win[ vendors[i] + 'CancelRequestAnimationFrame' ];
  }
}


/** visibility **/

var visibilityChange;

if ( !( 'hidden' in doc ) ) {

  var vendors = [ 'webkit', 'moz', 'ms', 'o' ];

  if ( doc.state ) vendors.length = 0;

  for ( var i = 0, l = vendors.length; i < l; i++ ) {

    if ( (vendors[i]+'Hidden') in doc ) {

      doc.state         = doc[ vendors[i] + 'VisibilityState' ];
      doc.hidden        = doc[ vendors[i] + 'Hidden'          ];
      visibilityChange  =      vendors[i] + 'visibilitychange' ;
    }
  }

  if ( !visibilityChange ) visibilityChange = 'visibilitychange';
  // var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
  // document.addEventListener(evtname, visChange);
}


/** Blob & ObjectURL **/

if ( !win.URL ) {

  win.URL = win.webkitURL || win.msURL || win.oURL;
}

if ( !win.Blob && !win.BlobBuilder ) {

  win.BlobBuilder = win.BlobBuilder       ||
                    win.WebKitBlobBuilder ||
                    win.MozBlobBuilder    ||
                    win.MSBlobBuilder     ||
                    win.OBlobBuilder;
}


/** setImmediate **/

if ( !win.setImmediate ) {

  win.setImmediate = (function () {

    var callbacks = [];

    win.addEventListener( 'message', handle, true );

    function handle() { callbacks.shift()(); }

    return function ( fn ) {

      if ( typeof fn !== 'function' ) throw Error('Invalid Argument');

      callbacks.push( fn );

      win.postMessage( 'setImmediate', '*' );
    };

  })();
}


/** user MediaStream **/

if ( !nav.getUserMedia ) {

  nav.getUserMedia =  ( nav.mozGetUserMedia     ||
                        nav.webkitGetUserMedia  ||
                        nav.msGetUserMedia          ).bind(nav);
}


/** PeerConnection **/

if ( typeof win.RTCPeerConnection !== 'function' ) {

  win.RTCPeerConnection = win.mozRTCPeerConnection    ||
                          win.webkitRTCPeerConnection;


  /** Modify the configurations to adjust the different address formats **/

  win.RTCPeerConnection = (function(){

    var vendorConnection = win.RTCPeerConnection;

    return function adjustServer ( addresses, constraints ) {

      var iceServers = addresses.iceServers,

          current, server, url, type;

      for ( var i = 0, l = iceServers.length; i < l; i++ ) {

        current = iceServers[i];
        server  = null;

        url     = current.url;
        type    = url.split(':')[0];

        if ( type === 'stun' ) server = { url: url };

        if ( type === 'turn' ) server = parseTURN ( url, current.username, current.password ) || {};

        if ( !server.url ) throw new Error('Invalid server address - ', current );

        iceServers[i] = server;
      }

      return new vendorConnection( addresses, constraints );
    };


    /** Select the appropriate TURN version **/

    function parseTURN ( url, username, password ) {

      if ( moz ) { // Firefox

        if ( url.indexOf('transport=udp') !== -1 || url.indexOf('?transport') === -1 ) {

          return { url: url.split('?')[0], credential: password, username: username };
        }
      }

      if ( chrome ) { // Chrome

        if ( chrome > 28 ) return { url: url, credential: password, username: username };

        return { url: 'turn:' + username + '@' + url.split('turn:')[1], credential: password };
      }
    }

  })();

}


/** Firefox **/

if ( typeof win.RTCSessionDescription !== 'function' ) {

  win.RTCSessionDescription = win.mozRTCSessionDescription;
}


if ( typeof win.RTCIceCandidate !== 'function' ) {

  win.RTCIceCandidate = win.mozRTCIceCandidate;
}


/** Provide placeholder audio/video tracks for consistency **/

if ( moz ) {

  // or mozMediaStream ? // return this.videoTracks

  MediaStream.prototype.getVideoTracks = function(){
    return [];
  };

  MediaStream.prototype.getAudioTracks = function(){
    return [];
  };

}




/** Chrome **/

if ( win.webkitRTCPeerConnection && !win.webkitRTCPeerConnection.prototype.getLocalStreams ) {

  // New Syntax of getXXStreams in M26
  win.webkitRTCPeerConnection.prototype.getLocalStreams = function(){
    return this.localStreams;
  };

  win.webkitRTCPeerConnection.prototype.getRemoteStreams = function(){
    return this.remoteStreams;
  };


  // Streaming tracks got changed in M26
  if ( !win.webkitMediaStream.prototype.getVideoTracks ) {

    win.webkitMediaStream.prototype.getVideoTracks = function(){
      return this.videoTracks;
    };

    win.webkitMediaStream.prototype.getAudioTracks = function(){
      return this.audioTracks;
    };
  }

}

/**
 *  Detect
 *  ======
 *
 *  Checks if the required features or status is supported by the browser.
 */


var features  = [ 'URL', 'Blob', 'crypto', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

  if ( !(features[i] in win ) ) console.log( 'Missing: ', features[i] );
}

if ( !win.RTCPeerConnection ) return alert('Your browser doesn\'t support PeerConnections yet.');


/**
 *  Returns the endianess of the system
 *
 *  @return {Boolean}
 */

var littleEndian = (function(){

    var arr32   = new Uint32Array(1),
        arr8    = new Uint8Array( arr32.buffer );

    arr32[0] = 255;

    return !!arr8[0]; // 255 0 0 - litte  ||  0 0 255 - big
})();

/**
 *  Debug
 *  =====
 *
 *  Debugging calls to help on local development.
 */


/**
 *  Show a counted debug message
 *
 *  @param {String} text   -
 */

function debug ( text ) {

  if ( !PLAYER || !LOCAL.log ) LOCAL.log = 0;

  if ( text[text.length - 1] === '\n' ) {

    text = text.substring( 0, text.length - 1 );
  }

  var num = ++localStorage.log,
      msg = '(' + num + ') - ' + ( (performance.now()) / 1000 ).toFixed(3) + ': ' + text;

  console.log( msg );
}


/**
 *  Resets "debug"-counter
 */

win.clearDebug = function() {

  delete LOCAL.log;
};


/**
 *  General logger to show error messages
 *
 *  @param {Object} err   -
 */

function loggerr ( err )  {

  console.warn('[ERROR] ', err );
  console.warn( err.name + ': ' + err.message );
}


/**
 *  Informs if the developer tools are enabled for debugging
 *  (see: https://github.com/adamschwartz/chrome-inspector-detector )
 *
 *  @return {Boolean}
 */

function isDebugging(){

  // firebug
  if ( moz ) return !!console.log;

  // chrome
  var existingProfiles = console.profiles.length;

  console.profile();
  console.profileEnd();

  if ( console.clear ) console.clear();

  return console.profiles.length > existingProfiles;
}

/**
 *  Base
 *  ====
 *
 *  Framework foundations.
 */


var reservedReference = context.pg,

    pg = Object.create( null );


/**
 *  Information about the current version
 *
 *  @type {Object}
 */

VERSION = {

  codeName    : 'spicy-phoenix',
  full        : '0.4.7',
  major       : 0,
  minor       : 4,
  dot         : 7
};


/**
 *  Restore and provide the last reference for the namespace "pg"
 *
 *  @return {Object}
 */

function noConflict(){

  context.pg = reservedReference;

  return this;
}

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


/**
 *  Misc
 *  ====
 *
 *  A collection of common utilities / misc.
 */


/**
 *  Improved typeof version
 *
 *  @param {String|Number|Object} obj   -
 */

function type ( obj ) {

  return Object.prototype.toString.call( obj ).slice( 8, -1 );
}


/**
 *  Extends the properties of an object
 *
 *  @param {Object} target   -
 */

function extend ( target ) {

  var source, key;

  for ( var i = 1, length = arguments.length; i < length; i++ ) {

    source = arguments[i];

    for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
  }

  return target;
}


/**
 *  Setting reference for the prototype chain
 *  (see: NodeJS - https://github.com/joyent/node/blob/master/lib/util.js )
 *
 *  @param {Object} child    -
 *  @param {Object} parent   -
 */

function inherits ( child, parent ) {

  child.prototype = Object.create( parent.prototype, {

    constructor: {

      value         : child,
      enumerable    : false,
      writable      : true,
      configurable  : true
    }
  });
}


/**
 *  Retrieve a simple token
 */

function getToken() {

  return Math.random().toString(36).substr( 2, 10 );
}

/**
 *  Misc
 *  ====
 *
 *  More specific helpers.
 */


/**
 *  Converts parameter into a querystring
 *
 *  @param {Object} params   -
 */

function createQuery ( params ) {

  if ( typeof params != 'object' ) return;

  var keys = getKeys( params ),
      query = [];

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    query[i] = params[keys] + '/';
  }

  return query.join('');
}


/**
 *  Executes functions on a queue with the provided arguments
 *
 *  @param  {Array} queue       -
 *  @param  {}      arguments
 */

function executeQueue ( list ) {

  var args = [], fn;

  args.push.apply( args, arguments );

  args.shift(); // queue

  while ( list.length ) {

    fn = list.shift();

    if ( typeof fn === 'function' ) fn.apply( fn, args );
  }
}


/**
 *  Gets an identifiying hash code from a string
 *  (see: http://jsperf.com/hashing-a-string/3 || http://jsperf.com/hashing-strings/14 )
 *
 *  @param {String} str   -
 */

// utils.getHash = function getHash ( str ) {

//   var hash = 0,

//       i    = ( str && str.length ) ? str.length : 0;

//   while ( i-- ) hash = hash * 31 + str.charCodeAt(i);

//   return hash;
// };


/**
 *  Converts a string into an arraybuffer
 *  (see: http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String )
 *
 *  @param {String} str   -
 */

// utils.StringToBuffer = function StringToBuffer ( str ) {

//   var buffer  = new ArrayBuffer( str.length * 2 ),
//       view    = new Uint16Array( buffer );

//   for ( var i = 0, l = str.length; i < l; i++ ) {

//     view[i] = str.charCodeAt(i);
//   }

//   return buffer;
// };


/**
 *  Converts a buffer into a string
 *
 *  @param {Array} buffer   -
 */

// utils.BufferToString = function BufferToString ( buffer ) {

//   return String.fromCharCode.apply( null, new Uint16Array( buffer ) ) ;
// };


/**
 *  Reactor
 *  =======
 *
 *  A reactive object which notifies its subscribers as properties get changed.
 */


var reactList =  [],   // record of reactors

    SYNC      = 100;   // delay to check the difference of properties


/**
 *  Creates basic object and setup handler
 *
 *  @return {Object}
 */

var getReactor = function() {

  var args = [], obj = Object.create( Object.prototype );

  args.push.apply( args, arguments );

  reactList.push({ reference: {}, callbacks: args });

  checkProperties( reactList.length - 1, obj );

  return obj;
};


/**
 *  Check properties to attach watcher
 *
 *  @param  {Number} id        -
 *  @param  {Object} current   -
 */

function checkProperties ( id, current ) {

  var last    = reactList[id].reference,
      diff    = getDifferences( last, current ),

      add     = diff.add,
      remove  = diff.remove,

      i, l;


  // add - watching | unwatch - remove
  if ( add.length || remove.length ) {

    for ( i = 0, l = add.length; i < l; i++ ) defineProperty( id, current, add[i] );

    for ( i = 0, l = remove.length; i < l; i++ ) delete last[ remove[i] ];
  }

  setTimeout( checkProperties, SYNC, id, current );
}


/**
 *  Determines the differences which properties got removed or added
 *
 *  @param  {Object} last      -
 *  @param  {Object} current   -
 *  @return {Object}
 */

function getDifferences ( last, current ) {

  var lastKeys    = getKeys( last ),
      currentKeys = getKeys( current ),

      add         = [],
      remove      = [],

      i, l;

  for ( i = 0, l = lastKeys.length; i < l; i++ ) {

    if ( current[ lastKeys[i] ] == void 0 ) remove.push( lastKeys[i] );
  }

  for ( i = 0, l = currentKeys.length; i < l; i++ ) {

    if ( last[ currentKeys[i] ] == void 0 ) add.push( currentKeys[i] );
  }

  return { add: add, remove: remove };
}


/**
 *  Adds getter & setter to a property, which triggers a define callback
 *
 *  @param  {Number} id        -
 *  @param  {Object} current   -
 *  @param  {String} prop      -
 */

function defineProperty ( id, current, prop ) {

  var getter = function() { return reactList[id].reference[ prop ]; },

      setter = function ( value ) {

        // prevent redundancy: old = new
        if ( value === reactList[id].reference[ prop ] ) return;


        if ( typeof value === 'object' ) {

          if ( !Array.isArray(value) ) {

            /**
             *  Method cloaking inspured by @Watch.JS
             *  (see: https://github.com/melanke/Watch.JS )
             */

            var methods = [ 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift' ];

            for ( var i = 0, l = methods.length; i < l; i++ ) setMethod( value, methods[ i ] );

          } else {

            value = extend( getReactor( function ( inner, value ) {

              var result = reactList[id].reference[ prop ];

              result[inner] = value;

              return refer( result );

            }), value );
          }

        }


        refer( value );


        function refer ( value ) {

          reactList[id].reference[ prop ] = value;

          var callbacks = reactList[id].callbacks,

              i, l;

          for ( i = 0, l = callbacks.length; i < l; i++ ) {

            callbacks[i].apply( callbacks[i], [ prop, value ] );
          }

          return value;
        }


        function setMethod( arr, fn ) {

          arr[ fn ] = function(){

            Array.prototype[ fn ].apply( this, arguments );

            return refer( arr );
          };
        }

      };


  // initial call + set diff
  setter( current[prop] );

  Object.defineProperty( current, prop, {

    enumerable  : true,
    configurable: true,
    get         : getter,
    set         : setter
  });
}

/**
 *  Emitter
 *  =======
 *
 *  A Mediator for handling messages via events.
 */

// user: player - peers
var eventMap = {};


/**
 *  Constructor to setup the container for the topics
 *
 *  @return {Object}
 */

var Emitter = function() {

  if ( this instanceof Peer ) {

    eventMap[ this.id ] = {};

  } else {

    this._events        = {};
  }

  return this;
};


/**
 *  Register/Subscribe callbacks to topics
 *
 *  @param  {String}   topics     -
 *  @param  {Function} callback   -
 *  @param  {Object}   context    -
 *  @return {Object}
 */

Emitter.prototype.on = function ( topics, callback, context ) {

  if ( typeof callback !== 'function' ) return;

  topics = topics.split(' ');

  var events  = ( this instanceof Peer ) ? eventMap[ this.id ] : this._events,
      length  = topics.length,
      topic;

  while ( length-- ) {

    topic = topics[ length ];

    if ( !events[ topic ] ) events[ topic ] = [];

    events[ topic ].push([ callback, context ]);
  }

  return this;
};


/**
 *  Register for one time usage
 *
 *  @param  {String}   topics     -
 *  @param  {Function} callback   -
 *  @param  {Object}   context    -
 *  @return {Object}
 */

Emitter.prototype.once = function ( topics, callback, context ) {

  this.on( topics, function once() {

    this.off( topics, once );

    callback.apply( this, arguments );

  }.bind(this));

  return this;
};



/**
 *  Triggers listeners and sends data to subscribes functions
 *
 *  @param  {String} topic   -
 *  @return {Object}
 */

Emitter.prototype.emit = function ( topic ) {

  var events    = ( this instanceof Peer ) ? eventMap[ this.id ] : this._events,

      listeners = events[ topic ];

  if ( listeners ) {

    var args    = Array.prototype.slice.call( arguments, 1 ),

        length  = listeners.length;

    while ( length-- ) {

      listeners[length][0].apply( listeners[length][1], args || [] );
    }
  }

  return this;
};


/**
 *  Unsubscribe callbacks from a topic
 *
 *  @param  {String}   topic      - topic of which listeners should be removed
 *  @param  {Function} callback   - specific callback which should be removed
 *  @return {Object}
 */

Emitter.prototype.off = function ( topic, callback ) {

  var events    = ( this instanceof Peer ) ? eventMap[ this.id ] : this._events,
      listeners = events[ topic ];

  if ( !listeners ) return;

  if ( !callback ) {

    events[ topic ].length = 0;

  } else {

    var length = listeners.length;

    while ( length-- ) {

      if ( listeners[ length ] === callback ) {

        listeners.splice( length, 1 ); break;
      }
    }
  }

  return this;
};

/**
 *  Stream
 *  ======
 *
 *  Interface for handling streaming behavior.
 */


/**
 *  Constructor to define configurations and setup buffer
 *
 *  @param  {Object} options   -
 */

var Stream = function ( options ) {

  if ( !options ) options = {};

  this.readable     = options.readable;
  this.writeable    = options.readable;

  this.ready        = true;

  this.writeBuffer  = [];
  this.readBuffer   = [];

  Emitter.call( this );
};


/**
 *  Stream <- Emitter
 */

inherits( Stream, Emitter );


/**
 *  Delegates the action for the data (chunk or message)
 *
 *  @param  {Object} e   -
 */

Stream.prototype.handle = function ( e ) {

  var msg     = e.data,

      data    = JSON.parse( msg ),

      buffer  = this.readBuffer;


  if ( data.part != void 0 ) {

    buffer.push( data.data );

    this.emit( 'data', data, buffer.length );

    if ( data.part > 0 ) return;

    msg = buffer.join('');

    buffer.length = 0;
  }

  this.emit( 'end', msg );
};


/**
 *  Send input through the stream
 *
 *  @param  {Object}  msg   -
 *  @return {Boolean}
 */

Stream.prototype.write = function ( msg ) {

  this.writeBuffer.push( msg );

  if ( this.ready ) {

    this.emit( 'write', this.writeBuffer.shift() );

  } else {

    // TODO: handle blocking simultaneous usage
  }

  return this.ready;
};


/**
 *  Uses the output of one stream as the input for another
 *
 *  @param  {Object} trg   -
 *  @return {Object}
 */

Stream.prototype.pipe = function ( trg ) {

  this.on( 'data', function ( chunk ) { trg.handle( chunk ); });

  return trg;
};


/**
 *  Handler
 *  =======
 *
 *  A wrapper to enhance DataChannels and eases the work.
 */


/**
 *  Constructor to define the basic information
 *
 *  @param {String} channel   -
 *  @param {String} remote    -
 */

var Handler = function ( channel, remote ) {

  var label    = channel.label;

  this.info    = { label: label, remote: remote };

  this.channel = channel;

  this.stream  = new Stream({ readable: true, writeable: true });

  this.actions = defaultHandlers[ label ] || defaultHandlers.custom;

  if ( typeof this.actions === 'function' ) this.actions = { end: this.actions };

  channel.addEventListener( 'open', this.init.bind(this) );
};


/**
 *  Wrap the custom events around the native listener
 *
 *  @param {Object} e   -
 */

Handler.prototype.init = function ( e ) {

  var channel     = this.channel,

      actions     = this.actions,

      stream      = this.stream,

      connection  = CONNECTIONS[ this.info.remote ],

      events = [ 'open', 'data', 'end', 'close', 'error' ];


  for ( var i = 0, l = events.length; i < l; i++ ) {

    stream.on( events[i], actions[ events[i] ], connection );
  }

  stream.on( 'write', function send ( msg ) { channel.send( msg ); });


  channel.onmessage = stream.handle.bind( stream );

  channel.onclose   = function() { stream.emit( 'close' );  };

  channel.onerror   = function ( err ) { stream.emit( 'error', err ); };

  stream.emit( 'open', e );
};


/**
 *  Sends string based messages
 *
 *  @param {Object} msg   -
 */

Handler.prototype.send = function ( msg ) {

  var data    = JSON.stringify( msg ),

      buffer  = data; //stringToBuffer( data );


  if ( buffer.length > config.handlerConfig.MAX_BYTES ) {
  // if ( buffer.byteLength > config.handlerConfig.MAX_BYTES ) {

    buffer = createChunks( buffer );

  } else {

    buffer = [ buffer ];
  }

  for ( var i = 0, l = buffer.length; i < l; i++ ) {

    this.stream.write( buffer[i] );
  }
};


/**
 *  Splits a buffer into smaller chunks
 *
 *  @param {String} buffer   -
 */

function createChunks ( buffer ) {

  var maxBytes  = config.handlerConfig.MAX_BYTES,
      chunkSize = config.handlerConfig.CHUNK_SIZE,
      size      = buffer.length, //byteLength,
      chunks    = [],

      start     = 0,
      end       = chunkSize;

  while ( start < size ) {

    chunks.push( buffer.slice( start, end ) );

    start = end;
    end   = start + chunkSize;
  }

  var l = chunks.length,
      i = 0;

  while ( l-- ) {

    chunks[l] = JSON.stringify({ part: i++, data: chunks[l] });
  }

  return chunks;
}

/**
 *  Service
 *  =======
 *
 *  Define default Handler for common tasks - e.g. establish a mesh network.
 */


var customHandlers = {};  // collection of custom handler


var defaultHandlers = {


  /**
   *  Basic information exchange on creation
   */

  init: {

    open: function() {

      // channel established + open
      delete this.info.pending;

      // share initial state
      this.send( 'init', {

        account : PLAYER.account,
        time    : PLAYER.time,
        data    : PLAYER.data,                // TODO: 0.6.0 -> define values for secure access
        list    : getKeys( CONNECTIONS )
      });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = PEERS[ this.info.remote ],
          data = msg.data;

      extend( peer.data, data.data );

      peer.time    = data.time;
      peer.account = data.account;

      MANAGER.check( data.list, this  );
      MANAGER.setup( this.info.remote );
    },

    /* previous unreliable - see gatheringstatechange */
    close: function ( msg ) { MANAGER.disconnect( this.info.remote ); }
  },


  /**
   *  Remote delegation for register another peer
   *
   *  @param {Object} msg   -
   */

  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== PLAYER.id ) {  // proxy -> info.transport

      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      //console.log('[ERORR] - Service: Missing Connection | ', msg.remote );
      if ( !CONNECTIONS[ msg.remote ] ) return;

      return CONNECTIONS[ msg.remote ].send( 'register', msg.data, proxy );
    }

    MANAGER.set( msg, this );
  },


  /**
   *  Run latency check by sending ping/pong signals
   *
   *  @param {Object} msg   -
   */

  ping: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.pong ) return this.send( 'ping', { pong: true, index: data.index });

    MANAGER.setup( msg.local, data.index, data.pong );
  },


  /**
   *  Permit the start of a game via remote request
   *
   *  @param  {[type]} msg [description]
   */

  start: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data || {};

    // late-join
    if ( data.request ) return forward( msg.local );

    // next in chain
    ensure();

    function ensure(){

      if ( !ROOM._start ) return setTimeout( ensure, DELAY );

      ROOM._start();
    }
  },


  /**
   *  Sets the keys and values of a peers remote model
   *
   *  @param {Object} msg   -
   */

  update: function ( msg ) {

    msg = JSON.parse( msg );

    PEERS[ msg.local ].data[ msg.data.key ] = msg.data.value;

    // TODO: 0.6.0 -> define values for secure access

    // console.log('[update] ', msg.data.key + ':' + msg.data.value );
  },


  /**
   *  Delegates synchronize requests of the shared object
   *
   *  @param {Object} msg   -
   */

  sync: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.resync ) return resync( msg.local, data.key, data.value );

    sync( data.key, data.value, true );
  },


  /**
   *  Invokes remote messages by call it them on your player
   *
   *  @param {Object} msg   -
   */

  message: function ( msg ) {

    PLAYER.emit( 'message', msg );
  },


  /**
   *  Using a shared channel to delegate remote calls
   *
   *  @param {Object} msg   -
   */

  custom: function ( msg ) {

    // console.log('[CUSTOM]');

    msg = JSON.parse( msg );

    console.log(msg.action);
  }

};

/**
 *  Socket
 *  ======
 *
 *  Transport layer used to communicate with the server.
 */


SOCKET = (function(){

  /** remove for SSE **/
  logout();

  win.addEventListener( 'unload'        , logout );
  win.addEventListener( 'beforeunload'  , logout );


  /**
   *  Request for EventSource / XHR-Polling
   *
   *  @param  {Object}   msg    -
   *  @param  {Function} next   -
   */

  function req ( msg, next ) {

    // TODO: pooling the request objects
    var xhr = new XMLHttpRequest();

    xhr.open( 'POST', config.socketConfig.server, true );

    if ( next ) {

      // ToDo: onprogress + check
      xhr.onload = function ( e ) {

        xhr.onload = null;
        next( e.currentTarget.response );
      };
    }

    xhr.setRequestHeader( 'Content-Type', 'text/plain; charset=UTF-8' );
    xhr.send( msg );
  }


  /**
   *  Removes ID/token from the server
   */

  function logout() {

    if ( checkProtocol('ws') || SERVERLESS ) return;

    if ( SESSION.id ) {

      // XHR
      send({ action: 'remove', data: SESSION.id }, function(){

        // beforeunload callback
        if ( QUEUE.length ) {

          delete SESSION.id;

          executeQueue( QUEUE );
        }
      });

    } else {

      executeQueue( QUEUE );
    }
  }


  var socket = null;

  /**
   *  Sets a session based ID and establish a server connection via WebSocket or EventSource
   *
   *  @param {String}   id       -
   *  @param {String}   origin   -
   *  @param {Function} next     -
   */

  function connectToServer ( id, origin ) {

    SESSION.id = id;

    var Socket = checkProtocol('http') ? EventSource : WebSocket;

    socket = new Socket( config.socketConfig.server + '/?local=' + id + '&origin=' + origin );

    socket.addEventListener( 'error' , handleError );

    socket.addEventListener( 'open' , function(){

      socket.addEventListener( 'message', handleMessage );
      socket.addEventListener( 'close'  , handleClose   );

      send({ action: 'lookup' }, function ( remoteID ) { MANAGER.check( remoteID ); });
    });

  }


  /**
   *  Delegate messages from the server
   *
   *  @param {Object} e   -
   */

  function handleMessage ( e ) {

    var msg = JSON.parse( e.data );

    if ( !msg || !msg.local ) { // partnerIDs

      return ( !QUEUE.length ) ? MANAGER.check( msg ) : executeQueue( QUEUE, msg );
    }

    MANAGER.set( msg );
  }


  /**
   *  Handle error messages/states
   *
   *  @param {Object} e   -
   */

  function handleError ( e ) {

    // XHR
    if ( e.eventPhase === EventSource.CLOSED ) return handleClose();

    try {

      e.currentTarget.close();

      logout();

    } catch ( err ) { console.log(err); }

    throw new Error( e.data );
  }


  /**
   *  Show message on closing
   */
  function handleClose(){

    console.log('[SOCKET] - CLOSE');
  }


  /**
   *  Sending messages and using callback depending on the transport
   *
   *  @param {Object}   msg    -
   *  @param {Function} next   -
   */

  function send ( msg, next )  {

    extend( msg, { local: PLAYER.id, origin: INFO.route });

    msg = JSON.stringify( msg );

    if ( checkProtocol('http') ) {

      req( msg, next );

    } else {  // WS

      if ( next ) QUEUE.push( next );

      if ( SERVERLESS ) return SERVERLESS( msg );

      socket.send( msg );
    }
  }


  /**
   *  Verify the used protocol by the server side component
   *
   *  @param {String} protocol   -
   */

  function checkProtocol ( protocol ) {

    return config.socketConfig.server.split(':')[0] === protocol;
  }



  return {

    init    : connectToServer,
    send    : send,
    handle  : handleMessage
  };

})();

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
  this._sendSDP     = null;

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

  // FF doesn't support re-negiotiation -> requires the setup before
  if ( moz ) createDefaultChannels( this );

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

    alert('Sorry, but an error occoured. Please revisit the site!');

    throw new Error('The underlying PeerConnection got closed too early...');
  }


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

    var channel = this.conn.createDataChannel( label, config.channelConfig );

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

  this._sendSDP = function ( num ) {

    this.send( 'expectPackages', { type: 'candidates', size: num });

    this.send( 'setConfigurations', desc );

  }.bind(this);

  // the remote doesn't set any candidates (ready/num will be 0) on the 2nd exchange + default (null)
  if ( ready != void 0 ) this._sendSDP( ready );
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

/**
 *  Manager
 *  =======
 *
 *  Helper for handling connections and delegate communication.
 */


var DELAY    =    0,  // max. latency evaluation

    PINGS    =  100,  // amount of packages to exchange for the latency test

    READY    =   {},  // record of current ready users

    TODO     =   {};  // available peers to connect


MANAGER = (function(){


  /**
   *  Check list for new connections
   *
   *  @param  {Array}  remoteList   -
   *  @param  {Object} transport    -
   */

  function check ( remoteList, transport ) {

    if ( !remoteList ) return;

    if ( !Array.isArray(remoteList) ) remoteList = [ remoteList ];

    var localID  = PLAYER.id,

        remoteID = remoteList.pop();

    this.connect( remoteID, true, transport );


    if ( !remoteList.length ) return;

    for ( var i = 0, l = remoteList.length; i < l; i++ ) {

      remoteID = remoteList[i];

      if ( remoteID === localID || CONNECTIONS[ remoteID ] ) continue; // skip

      TODO[ remoteID ] = transport;
    }
  }


  /**
   *  Connect with the new peer
   *
   *  @param {String}  remoteID    -
   *  @param {Boolean} initiator   -
   *  @param {Object}  transport   -
   */

  function connect ( remoteID, initiator, transport ) {

    if ( CONNECTIONS[ remoteID ] || remoteID === PLAYER.id ) return;

    // console.log( '[connect] to - "' + remoteID + '"' );

    PEERS[ remoteID ] = new Peer({ id: remoteID });

    CONNECTIONS[ remoteID ] = new Connection( PLAYER.id, remoteID, initiator, transport );
  }


  /**
   *  Clear references, triggers callbacks and re-orders on disconnection of a peer
   *
   *  @param {String} remoteID   -
   */

  function disconnect ( remoteID ) {

    var peer = PEERS[ remoteID ];

    if ( !peer ) return;

    delete READY[ remoteID ];

    PLAYER.emit( 'disconnect',      peer );
    if ( ROOM ) ROOM.emit( 'leave', peer );


    CONNECTIONS[ remoteID ].close();

    DATA.splice( peer.pos, 1 );

    delete PEERS[ remoteID ];
    delete CONNECTIONS[ remoteID ];

    order();
  }


  /**
   *  Set credentials and create entries as SDP & candidates arrives
   *
   *  @param {Object} msg         -
   *  @param {Object} transport   -
   */

  function set ( msg, transport ) {

    if ( !CONNECTIONS[ msg.local] ) this.connect( msg.local, false, transport );

    CONNECTIONS[ msg.local ][ msg.action ]( msg.data );
  }


  /**
   *  Inform other peers about the key/value change by using a multicast
   *  and updates the local backup
   *
   *  @param  {String}               key     -
   *  @param  {String|Number|Object} value   -
   */

  function update ( key, value ) {

    updateBackup();

    var ids = getKeys( CONNECTIONS );

    for ( var i = 0, l = ids.length; i < l; i++ ) {

      CONNECTIONS[ ids[i] ].send( 'update', { key: key, value: value }, true );
    }
  }


  var timer = {};

  /**
   *  Setup and tests the connection - benchmark the latency via ping/pong
   *
   *  @param {String}  remoteID   -
   *  @param {Number}  index      -
   *  @param {Boolean} pong       -
   */

  function setup ( remoteID, index, pong ) {

    if ( !pong ) return ping( remoteID );

    var col = timer[ remoteID ];

    col[index] = win.performance.now() - col[index];

    if ( !INGAME ) progress( col[0] );

    if ( --col[0] > 0 ) return;

    var latency = PEERS[ remoteID ].latency = col.reduce( sum ) / ( col.length - 1 );

    DELAY = Math.max( DELAY, latency );

    ready();

    function sum ( prev, curr ) { return prev + curr; }
  }


  /**
   *  Sends pings to other peers
   *
   *  @param {String} remoteID   -
   */

  function ping ( remoteID ) {

    var conn = CONNECTIONS[ remoteID ],

        num  = PINGS,

        col = timer[ remoteID ] = [ num ];

    for ( var i = 1; i <= num; i++ ) { col[i] = win.performance.now(); test( i ); }

    function test ( i ) {

      setTimeout( function(){ conn.send( 'ping', { index: i }, true ); }, Math.random() * num );
    }
  }


  var perc = 0;

  /**
   *  Provides feedback about the current progress
   *
   *  @param {Number} part   -
   */

  function progress ( part ) {

    part = PINGS - part;  // 0 -> 100

    var curr  = getKeys( PEERS ).length,
        diff  = getKeys( TODO  ).length,
        max   = diff + curr;

    part = ~~( curr * part / max );

    if ( part <= perc ) return;

    if ( ROOM ) ROOM.emit( 'progress', perc = part, max );

    // if ( perc === 99 ) perc = 0; // reset ?
  }


  /**
   *  Determines if all peers are connected and then emits the connections
   */

  function ready (){

    var keys  = getKeys( PEERS ),

        list  = [],

        peer;

    list[ PLAYER.pos ] = PLAYER;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      peer = PEERS[ keys[i] ];

      list[ peer.pos ] = peer;
    }


    var entry = getKeys( TODO ).pop();

    if ( entry ) {

      var transport = TODO[ entry ];

      delete TODO[ entry ];

      return MANAGER.check( entry, transport );
    }

    /** sort + emit users in order & prevent multiple trigger **/
    order();

    for ( i = 0, l = list.length; i < l; i++ ) {

      setTimeout( invoke, DELAY, list[i] );
    }


    function invoke( peer ) {

      if ( READY[ peer.id ] ) return;

      READY[ peer.id ] = true;

      PLAYER.emit( 'connection'     , peer );

      if ( ROOM ) ROOM.emit( 'enter', peer );
    }
  }


  /**
   *  Defines the peer order - ranked by the appearance / inital load
   */

  function order (){

    var keys  = getKeys( PEERS ),

        times = {};

    times[ PLAYER.time ] = PLAYER.id;

    for ( var i = 0, l = keys.length; i < l; i++ ) times[ PEERS[ keys[i] ].time ] = keys[i];

    var list = getKeys( times ).sort( rank ).map( function ( key ) { return times[key]; }),

        user;

    if ( list.length !== keys.length + 1 ) throw new Error('[ERROR] Precision time conflict.');

    DATA.length = 0;

    for ( i = 0, l = list.length; i < l; i++ ) {

      user     = PEERS[ list[i] ] || PLAYER;

      user.pos = DATA.push( user.data ) - 1;
    }

    function rank ( curr, next ) { return curr - next; }
  }



  return {

    check      : check,
    connect    : connect,
    disconnect : disconnect,
    set        : set,
    update     : update,
    setup      : setup
  };

})();




/**
 *  Info
 *  ====
 *
 *  A simple interface to provide access for internal data.
 */


extend( INFO, {

  route: null

});

// TODO: 0.6.0 -> data & info

/**
 *  Backup
 *  ======
 *
 *  Using local stored information to provide a backup for reconnection.
 */

if ( LOCAL.player ) {

  var range = parseFloat( JSON.parse(LOCAL.player).time ) +
              config.reconnectConfig.backupDuration - Date.now();

  if ( range >= 0 ) extend( BACKUP, JSON.parse(LOCAL.player) );
}

LOCAL.clear();


/**
 *  Overwrites the data in the localStorage
 */

function updateBackup() {

  LOCAL.player = JSON.stringify(PLAYER);
}


/**
 *  Uses the former data as initial values
 *
 *  TODO: check if account information (name) should also be stored
 *
 *  @param  {[type]} data [description]
 */

function restoreBackup ( player ) {

  if ( !config.reconnectConfig.restoreEnabled ) return;

  if ( BACKUP.id   ) player.id   = BACKUP.id;
  if ( BACKUP.time ) player.time = BACKUP.time;

  if ( !BACKUP.data ) return;

  var data = player.data,
      last = BACKUP.data, keys = getKeys(last);

  for ( var i = 0, l = keys.length; i < l; i++ ) data[ keys[i] ] = last[ keys[i] ];
}

/**
 *  Auth
 *  ====
 *
 *  Module for handling authentication for external party services.
 */


var AUTH = {

  'GITHUB'    : requestGithub,
  'PERSONA'   : requestPersona
  // 'TWITTER',
  // 'GOOGLE'     // https://github.com/googleplus/gplus-quickstart-javascript
  // 'FACEBOOK',
};


/**
 *  Login on Github
 *
 *  @param  {String}   id         -
 *  @param  {Function} callback   -
 */

function requestGithub ( id, callback ) {

  // TODO: 0.7.0 -> external login
}



/**
 *  Login via BrowserID
 *
 *  @param  {String}   id         -
 *  @param  {Function} callback   -
 */

function requestPersona ( id, callback ) {

  var URL    = 'https://login.persona.org/include.js',

      script = document.createElement('script');


  // TODO: 0.7.0 -> external login

  script.addEventListener( 'load', function(){

    navigator.id.watch({

      loggedInUser: localStorage['user'] || (function(){

        return '';
      })(),

      onlogin: function ( assertion ) {

        console.log(assertion);
      },

      onlogout: function(){

      }

    });


    navigator.id.request();

  });

  script.src = URL;

  document.getElementsByTagName('script')[0].parentNode.insertBefore( script );
}

/**
 *  Login
 *  =====
 *
 *  Entry for creating a player or use a service for additional data.
 */


/**
 *  Uses a plain text name or request more information via authentication
 *
 *  @param  {String}   name      -
 *  @param  {String}   service   -
 *  @param  {Function} hook      -
 */

function login ( name, service, hook ) {

  if ( PLAYER.id ) return PLAYER;

  if ( typeof service === 'function' ) { hook = service; service = null; }

  if ( service ) return requestOAuth( name, service, hook );

  var account = { name: name };

  createPlayer( account, hook );
}


/**
 *  Check if the selected service is supported and handles response
 *
 *  @param  {String}   name      -
 *  @param  {String}   service   -
 *  @param  {Function} hook      -
 */

function requestOAuth ( name, service, hook ) {

  service = service.toUpperCase();

  if ( !AUTH[ service ] ) return console.log('[ERROR] The chosen service is not supported yet.');

  // AUTH[ service ]( name , function ( account ) {

  var account = { name: name };

  createPlayer( account, hook );
  // });
}


/**
 *  Creates the player and extracts the initial route
 *
 *  @param {Object}   account   -
 *  @param {Function} hook      -
 */

function createPlayer ( account, hook ) {

  var origin = getPath();

  pg.player  = PLAYER = new Player( account, origin );

  if ( hook ) hook( PLAYER );

  PLAYER.join( origin );
}

/**
 *  Router
 *  ======
 *
 *  Matching the browser URL to specific routes for handling rooms (channel or game).
 */



var DEFAULT_ROUTE = 'lobby/',
    LAST_ROUTE    =     null,  // reference to the last route

    channelRoutes =       {},  // collection of the channel routes
    gameRoutes    =       {};  // collection of the game routes


/**
 *  Defines custom routes or changes the default path
 *
 *  @param  {Object} customRoutes   -
 *  @param  {String} defaultRoute   -
 *  @return {Array}
 */

function setRoutes ( customRoutes, defaultRoute ) {

  if ( !defaultRoute && typeof customRoutes === 'string' ) {

    defaultRoute = customRoutes;
    customRoutes = null;
  }

  if ( customRoutes ) defineCustomRoutes( customRoutes );
  if ( defaultRoute ) DEFAULT_ROUTE = defaultRoute;

  return [ channelRoutes, gameRoutes, DEFAULT_ROUTE ];
}


/**
 *  Sanitize the hash URL and provides the path
 *
 *  @return {String}
 */

function getPath(){

  var path = win.location.hash;

  path = ( path.length ) ? path.substr(3) : DEFAULT_ROUTE;

  return ( path.charAt(0) === '/' ) ? path.substr(1) : path;
}



var CHANNEL_PATTERN = /\/(.*?)\//g,
    ARGS_PATTERN    = /(\?)?:\w+/g;

/**
 *  Parsing and setting up custom routes
 *
 *  @param {Object} customRoutes   -
 */

function defineCustomRoutes ( customRoutes ) {

  channelRoutes = {};
  gameRoutes    = {};
}


/**
 *  Extract params and set info
 */

function checkRoute() {

  var path = getPath(),

      args = path.split('/');

  INFO.route = SESSION.route = path;

  if ( args.length < 1 ) return;

  // TODO: 0.7.0 -> customRoutes
  // if ( getKeys( CUSTOM_PATTERNS ).length ) extractRoute();

  matchRoute( args );
}


function extractRoute(){}         // TODO: 0.7.0 -> custom routes


/**
 *  Retrieve the room handler from the channel/game collections
 *
 *  @param {String} args   -
 */

function matchRoute ( args ) {

  var room = args.shift();

  if ( !room ) {

    win.location.hash = '!/' + DEFAULT_ROUTE;

    return;
  }

  var type = !args[0].length ? 'CHANNEL' : 'GAME';

  ROOM = room = ( type === 'CHANNEL' ) ? CHANNELS[ room ] || CHANNELS[ '*' ]  :
                                         GAMES[ args[0] ] ||    GAMES[ '*' ]  ;

  var params = args; // TODO: 0.7.0 -> parse for custom routes

  if ( LAST_ROUTE === INFO.route ) return;

  if ( room ) {

    if ( LAST_ROUTE  ) {  // change room

      var keys = getKeys( CONNECTIONS );

      for ( var i = 0, l = keys.length; i < l; i++ ) MANAGER.disconnect( keys[i] );

      SOCKET.send({ action: 'change', data: LAST_ROUTE });
    }

  } else {

    console.warn('[MISSING] ', type ,' handler doesn\'t exist!');
  }

  LAST_ROUTE = INFO.route;
}


/**
 *  Handles history navigation of the browser
 *
 *  @param {Object} e   -
 */

function leaveSite ( e ) {

  // prevent initial triggering
  if ( chrome ) { chrome = !chrome; return; }

  // if ( !history.state ) {
  //  console.log(LAST_ROUTE);
  //  return window.history.back();
  // }
}


/** attach listener **/

win.addEventListener( 'hashchange', checkRoute ); // join
win.addEventListener( 'popstate',   leaveSite  ); // history navigation



/**
 *  Creates a new room (channel or game) and registers handler
 *
 *  @param  {Function} type   -
 *  @return {Function}
 */

function createRoom ( type ) {

  return function ( id, handler ) {

    if ( typeof id !== 'string' ) { handler = id; id = '*'; }

    var room = new type( id ),

        list = ( room instanceof Game ) ? GAMES : CHANNELS;

    list[ id ] = room;

    handler( room );

    return room;
  };
}

/**
 *  Channel
 *  =======
 *
 *  An intermediate room for conversations.
 */


var CHANNELS = {};  // record of channels


/**
 *  Creates a Channel
 *
 *  @return {Object}
 */

var setChannel = createRoom( Channel );


/**
 *  Constructor to call init
 *
 *  @param {String} id   -
 */

function Channel ( id ) {

  this.init( id );

  this.match = function ( type ) {

    // TODO: 0.7.0 -> matchmaking
  };
}


/**
 *  Channel <- Emitter
 */

inherits( Channel, Emitter );


/**
 *  Assign id and invokes Emitter
 *
 *  @param {String} id   -
 */

Channel.prototype.init = function ( id ) {

  this.id = id;

  Emitter.call( this );
};


/**
 *  Allows to setup custom options for this channel/game
 *
 *  @param {Object} customConfig   -
 */

Channel.prototype.config = function ( customConfig ) {

  extend( this.options, customConfig );
};


/**
 *  Game
 *  ====
 *
 *  A room for handling gaming specific requirements.
 */


var GAMES   = {},     // record of games

    STARTER = null;   // bootstrap to forward the game start


/**
 *  Shortcut to setup a game handler
 */

var setGame = createRoom( Game );


/**
 *  Constructor to define the reference and options
 *
 *  @param {String} id   -
 */

function Game ( id ) {

  this.init( id );

  this.info    = {};                             // TODO: 0.6.0 -> data & info

  this.options = { minPlayer: 2, maxPlayer: 8 }; // TODO: 0.5.0 -> room options

  GAMES[ id ] = this;
}


/**
 *  Game <- Channel <- Emitter
 */

inherits( Game, Channel );


/**
 *  Starts the game as the minimum amount of players joined
 *
 *  @param {Function} initialize   - bootstrapping function to start the game
 */

Game.prototype.start = function ( initialize ) {

  this._start = function(){ initialize(); INGAME = true; forward.call( this ); };


  var ready = getKeys( READY ).length;

  if ( ready  <  this.options.minPlayer ) return;     // less player  - wait

  if ( ready === this.options.minPlayer ) {

    if ( PLAYER.pos === 0 ) {

      if ( !INGAME ) return this._start();

      // re-join to minmum | prevent reset
      forward.call( this, getKeys(pg.peers)[0] );
    }

    return;
  }

  if ( ready > this.options.minPlayer ) {          // more player   - late join

    if ( PLAYER.pos >= this.options.minPlayer ) request();

    return;
  }

  // TODO: 0.5.0 -> maxPlayer will be handled
};


Game.prototype.end      = function(){ INGAME = false; };  // TODO: 0.6.0 -> player handling

Game.prototype.pause    = function(){};                   // TODO: 0.6.0 -> player handling

Game.prototype.unpause  = function(){};                   // TODO: 0.6.0 -> player handling



/**
 *  Ask the previous peer if your allowed/ready to start | late-join
 */

function request() {

  var keys = getKeys( PEERS ),
      curr = PLAYER.pos;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    if ( curr - 1 === PEERS[ keys[i] ].pos ) {

      return CONNECTIONS[ keys[i] ].send( 'start', { request: true }, true );
    }
  }
}


/**
 *  Invokes the start of the next peers
 *
 *  @param {String} remoteID   - will be provided by late join & request
 */

function forward ( remoteID ) {

  STARTER = function(){

    STARTER = null;

    setTimeout(function(){

      var keys = getKeys( PEERS ),
          curr = PLAYER.pos;

      for ( var i = 0, l = keys.length; i < l; i++ ) {

        if ( curr + 1 === PEERS[ keys[i] ].pos ) {

          CONNECTIONS[ keys[i] ].send( 'start' );
          break;
        }
      }

      if ( this._start ) delete this._start;

    }.bind(this), DELAY * 5 ); // see batching the changes

  }.bind(this);



  if ( !remoteID ) return;


  /** get sync object **/

  var conn = CONNECTIONS[ remoteID ],

      keys = getKeys( pg.sync ),

      prop;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    prop = keys[i];

    conn.send( 'sync', { resync: true, key: prop, value: pg.sync[prop] }, true );
  }

  if ( STARTER ) STARTER();
}

/**
 *  Media
 *  =====
 *
 *  Wrapper for handling MediaStreams - creating an additional connection asides the DataChannel.
 */


/**
 *  Constructor to setup up the basic information
 *
 *  @param  {String}  local       -
 *  @param  {String}  remote      -
 *  @param  {Boolean} initiator   -
 *  @param  {Object}  transport   -
 */

var Media = function ( local, remote, initiator, transport ) {

  this.info = { local: local, remote: remote, pending: true };

  if ( initiator ) this.info.initiator = true;
  if ( transport ) this.info.transport = transport;

  this.channels = {};

  this.init();
};


/**
 *  Create connection and setup receiver
 */

Media.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

  this.checkStateChanges();

  this.findICECandidates();

  if ( this.info.initiator ) {

    this.requestStream();
  }
};


/**
 *  Media <- Connection
 */

inherits( Media, Connection );


/**
 *  Attach handler for incoming streams
 */

Media.prototype.attachStream = function(){

  var conn = this.conn;

  conn.onaddstream = function ( e ) {

    console.log('[MEDIA] - Added Stream');
    console.log(e);

    // var video = document.createElement('video');
    // video.src = URL.createObjectURL( e.stream );
    // video.autoplay = true;

    // var box = document.createElement('div');
    // box.textContent = this.remoteID;
    // box.className = 'name';
    // box.appendChild(video);

    // document.body.appendChild( box );
  };


  conn.onremovestream = function ( e ) {

    console.log('[MEDIA] - Removed Stream');

    // document.getElementById('vid2').src = null;
    URL.revokeObjectURL( e.stream );
  };

};


/**
 *  Request media input via camera/microphone
 *
 *  @param {String} el   -
 */

Media.prototype.requestStream = function ( el ) {

  var permissions = { audio: true, video: true };

  win.navigator.getUserMedia( permissions, function ( stream ) {

    var videoTracks = stream.getVideoTracks(),
        audioTracks = stream.getAudioTracks();

    conn.addStream( stream );

    // this.createOffer();

    if ( !el ) return;

    var video = document.createElement('video');

    video.src      = createObjectURL( stream );
    video.autoplay = true;

    document.getElementById( el ).appendChild( video );
  });

};


/**
 *  Peer
 *  ====
 *
 *  Model for a "peer" - a representation of an other player.
 */


// pg.peers = {}; // collection of all connected peers

// DATA  = []; // shortcut to access the stored data


/**
 *  Constructor to diverge the intial parameters
 *
 *  @param  {Object} data   -
 */

var Peer = function ( params ) {

  this.init( params.id, params.account || {}, params.data || {} );
};


/**
 *  Peer <- Emitter
 */

inherits( Peer, Emitter );


/**
 *  Assign properties for basic the structure
 *
 *  @param  {String} id        -
 *  @param  {Object} account   -
 *  @param  {Object} data      -
 */

Peer.prototype.init = function ( id, account, data ) {

  this.id      = id;

  this.account = account;

  this.data    = data;

  this.pos     = DATA.push( this.data ) - 1;

  Emitter.call( this, id );
};

//= require "_watch.js"
/**
 *  Player
 *  ======
 *
 *  Model for your player - an extension based on a "peer".
 */


/**
 *  Allow the declaration of callbacks before the player gets created
 */

var callbackRefs = {};

PLAYER = {

  on: function ( channel, callback, context ) {

    if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

    callbackRefs[ channel ].push([ callback, context ]);
  }
};


/**
 *  Constructor to define the basic setup
 *
 *  @param  {Object} account   -
 *  @param  {String} origin    - current path (URL fragment)
 */

var Player = function ( account, origin ) {

  var id    = createUID(),

      data  = getReactor( MANAGER.update );

  this.time = Date.now();

  /** Assign properties **/

  this.init( id, account, data );

  restoreBackup( this );

  if ( getKeys( callbackRefs ).length ) eventMap[ this.id ] = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  if ( SERVERLESS ) return setImmediate(function(){ MANAGER.check([ 'SERVERLESS' ]); });


  /** Executes after logout & socket creation **/

  var register = function(){ SOCKET.init( id, origin ); };

  if ( !QUEUE.length ) return register();

  QUEUE.push( register );
};


/**
 *  Player <-- Peer
 */

inherits( Player, Peer );


/**
 *  Formats the input and change the URL to trigger routes for a channel / game
 *
 *  @param  {String|Number} channel [description]
 *  @param  {Object}        params  [description]
 */

Player.prototype.join = function ( channel, params ) {

  if ( typeof channel !== 'string' ) channel = channel.toString();

  if ( channel.charAt(0) === '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, createQuery( params ) ].join('');

  if ( path.charAt( path.length - 1 ) !== '/' ) path += '/';

  // consider hash-cache
  if ( win.location.hash === path && path === '!/' + SESSION.route ) return checkRoute();

  win.location.hash = path;
};


/**
 *  Sends a message to a specific peer, a list of peers or even all
 *
 *  @param  {Array}  list   -
 *  @param  {String} msg    -
 */

Player.prototype.send = function ( list, msg ) {

  if ( !msg ) { msg = list; list = null; }

  if ( typeof msg !== 'string' ) msg = msg.toString();

  if ( !list ) list = getKeys( CONNECTIONS );

  if ( !Array.isArray( list ) ) list = [ list ];

  for ( var i = 0, l = list.length; i < l; i++ ) {

    CONNECTIONS[ list[i] ].send( 'message', { local: this.name, msg: msg }, true );
  }
};


/**
 *  Creates and offers a MediaStream
 *
 *  @param  {String}   id         -
 *  @param  {Object}   config     -
 *  @param  {Function} callback   -
 */

Player.prototype.media = function ( id, config, callback ) {

  // || TODO: 0.5.0 -> mediaStream()
};


/**
 *  Creates a secure random user ID
 *  (see: @broofa - http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523 )
 */

function createUID() {

  var pool = new Uint8Array( 1 ),

    random, value,

    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function ( c ) {

      random = crypto.getRandomValues( pool )[0] % 16;

      value = ( c === 'x' ) ? random : (random&0x3|0x8);

      return value.toString(16);
    });

  return id;
}

/**
 *  Loop
 *  ====
 *
 *  Game loop wrapper for continuous processing.
 */


var RUNNING = false,  // current state of loop

    REF     = null;   // refenrece for the callback

/**
 *  Setup the rendering loop and provide inject the time difference
 *
 *  @param  {Function} render   -
 */

function loop ( render ) {

  if ( RUNNING ) return;

  RUNNING = true;

  REF     = render;

  var time = 0, delta = 0, last = 0;

  requestAnimationFrame( function () { last = win.performance.now(); run(); });

  function run() {

    // workaround: firefox doesn't use performance.now() but Date.now()
    time  = win.performance.now();
    delta = time - last;
    last  = time;

    render( delta ); // throttle( render, delta );

    if ( RUNNING ) requestAnimationFrame( run );
  }
}


var LOOP_TIME = DELAY,   // treshhold for fix framerate

    DIFF      = 0;       // tracking the latest time differences

/**
 *  Keep a constant framerate for the rendering
 *
 *  @param  {Function} render   -
 *  @param  {Number}   delta    -
 */

function throttle ( render, delta ) {

  DIFF += delta;

  while ( DIFF >= LOOP_TIME ) {

    DIFF -= LOOP_TIME;

    render( delta );
  }
}


/**
 *  Stop the loop
 */

loop.stop = function(){

  RUNNING = false;
};


/**
 *  Restart the loop
 */

loop.resume = function(){

  loop(REF);
};


/**
 *  Pauses the game and adjust the title
 *
 *  @param  {Object} e   -
 */

function checkPause ( e ) {

  var title = doc.title.split('[PAUSE]').pop();

  if ( !doc.hidden ) loop.stop();

  doc.title = ( doc.hidden ? '[PAUSE] - ' : '' ) + title;

  //TODO: 0.6.0 -> pause/resume

  // ROOM.emit( 'pause', PLAYER ); // send 'pause' to others as well
}


/** Handler for visibility change **/

doc.addEventListener( visibilityChange, checkPause );

/**
 *  Sync
 *  ====
 *
 *  A synchronized shared object - which accessible by all users.
 */


/**
 *  Public interface for the synchronize object
 *
 *  @type {[type]}
 */

SYNC = getReactor( batch(sync) );


var CACHE  = {},  // record of still pending properties

    SOLVED = {};  // temporary list for confirmed values


/**
 *  Combine multiplee changes to one batch,
 *  to process them as one and avoid unrequired network transfer
 *
 *  @param  {Function} fn    -
 *  @return {Function}
 */

function batch ( fn ) {

  var list      = {},

      timeoutID = null;


  function share()  {

    timeoutID = null;

    var keys = getKeys(list),

        prop;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      prop = keys[ i ];

      sync( prop, list[ prop ] );

      delete list[ prop ];
    }

    /** defined in game -> forward **/
    if ( STARTER ) STARTER();
  }


  return function ( key, value ) {

    list[key] = value;

    if ( timeoutID ) clearTimeout( timeoutID );

    timeoutID = setTimeout( share, DELAY );
  };
}


/**
 *  Share the property (key/value) with other peers
 *
 *  @param  {String}               key         -
 *  @param  {String|Number|Object} value       -
 *  @param  {Boolean}              confirmed   -
 */

function sync ( key, value, confirmed ) {

  if ( confirmed ) {

    if ( !CACHE[key] || CACHE[key].results[ PLAYER.pos ] !== value ) {

      SOLVED[ key ]  = true;
      pg.sync[ key ] = value;
    }

    delete CACHE[key];        // console.log( '[CONFIRMED]', value    );
    return;
  }


  if ( CACHE[ key ] ) return; // console.log( '[CACHED]', CACHE[key]  );

  if ( SOLVED[ key ] ) {      // console.log( '[SOLVED]', SOLVED[key] );

    delete SOLVED[key];
    return;
  }

  var ids = getKeys( CONNECTIONS );

  // TODO: 0.6.0 -> conflict with multiple ? - currently just one
  CACHE[key] = { list: ids, results: [] };

  CACHE[key].results[ PLAYER.pos ] = value;

  for ( var i = 0, l = ids.length; i < l; i++ ) {

    CONNECTIONS[ ids[i] ].send( 'sync', { key: key, value: value }, true );
  }
}


/**
 *  Exchange value with remote data & merge on conflict
 *
 *  @param  {String} remoteID   -
 *  @param  {String} key        -
 *  @param  {String} value      -
 */

function resync ( remoteID, key, value ) {

  var entry = CACHE[key];

  if ( !entry ) { // noConflict

    sync( key, value, true );

    return CONNECTIONS[ remoteID ].send( 'sync', { resync: true, key: key, value: value }, true );
  }

  // TODO: 0.6.0 -> handle conflict (lower pos)
  console.log('[CONFLICT]');

  // take the reslt from the element which is lower -> can be called multiple times on mulit conflicts etc.

  // entry.list.length -= 1;

  // entry.results[ PEERS[remoteID].pos ] = value;

  // if ( entry.list.length ) return;
}



  /** API **/

  extend( pg, {

    'noConflict'  : noConflict,       // -> core/_base.js
    'VERSION'     : VERSION,          // -> core/_base.js
    'info'        : INFO,             // -> meta/_info.js

    'config'      : setConfig,        // -> core/_config.js
    'login'       : login,            // -> meta/_login.js

    'player'      : PLAYER,           // -> game/_player.js
    'peers'       : PEERS,            // -> game/_peers.js
    'data'        : DATA,             // -> game/_peers.js
    'sync'        : SYNC,             // -> game/_sync.js

    'loop'        : loop,             // -> game/_loop.js

    'channel'     : setChannel,       // -> meta/_channel.js
    'game'        : setGame,          // -> meta/_game.js
    'routes'      : setRoutes         // -> meta/_routes.js
  });

	return pg;
});
