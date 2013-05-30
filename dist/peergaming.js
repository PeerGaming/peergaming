/**
 *	peergaming.js - v0.4.0 | 2013-05-30
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

    moz     = !!win.navigator.mozGetUserMedia,

    chrome  = !!win.chrome,

    SESSION = win.sessionStorage,

    LOCAL   = win.localStorage,

    rand    = Math.random;


/** internal  **/

var INSTANCE    = null,   // pg.player

    PEERS       = null,   // pg.peers

    INFO        = null,   // pg.info

    ROOM        = null,   // current room

    CONNECTIONS =   {},   // datachannel for each peer

    MEDIAS      =   {};   // mediastreams for each peer

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

if ( !navigator.getUserMedia ) {

  navigator.getUserMedia =  navigator.mozGetUserMedia     ||
                            navigator.webkitGetUserMedia  ||
                            navigator.msGetUserMedia;
}


/** PeerConnection **/

if ( typeof win.RTCPeerConnection !== 'function' ) {

  win.RTCPeerConnection = win.mozRTCPeerConnection    ||
                          win.webkitRTCPeerConnection;
}


/** Firefox **/

if ( typeof win.RTCSessionDescription !== 'function' ) {

  win.RTCSessionDescription = win.mozRTCSessionDescription;
}


if ( typeof win.RTCIceCandidate !== 'function' ) {

  win.RTCIceCandidate = win.mozRTCIceCandidate;
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

/** last browser change broke API **/
if ( moz ) return alert('Unfortunately the Firefox support got broken with the last update.\n\
                         Please use Chrome at the moment and look forward for the next version!');


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

  if ( !INSTANCE || !LOCAL.log ) LOCAL.log = 0;

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

pg.VERSION = {

  codeName    : 'spicy-phoenix',
  full        : '0.4.0',
  major       : 0,
  minor       : 4,
  dot         : 0
};


/**
 *  Restore and provide the last reference for the namespace "pg"
 *
 *  @return {Object}
 */

pg.noConflict = function(){

  context.pg = reservedReference;

  return this;
};

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

pg.config = setConfig;


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

  utils.extend( config, customConfig );

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


/**
 *  Misc
 *  ====
 *
 *  Collection of utilities / helpers.
 */


var utils = {};   // Module


/**
 *  Improved typeof version
 *
 *  @param {String|Number|Object} obj   -
 */

utils.check = function ( obj ) {

  return Object.prototype.toString.call( obj ).slice( 8, -1 );
};


/**
 *  Extends the properties of an object
 *
 *  @param {Object} target   -
 */

utils.extend = function extend ( target ) {

  var source, key;

  for ( var i = 1, length = arguments.length; i < length; i++ ) {

    source = arguments[i];

    for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
  }

  return target;
};


/**
 *  Setting reference for the prototype chain
 *  (see: NodeJS - https://github.com/joyent/node/blob/master/lib/util.js )
 *
 *  @param {Object} child    -
 *  @param {Object} parent   -
 */

utils.inherits = function inherits ( child, parent ) {

  child.prototype = Object.create( parent.prototype, {

    constructor: {

      value         : child,
      enumerable    : false,
      writable      : true,
      configurable  : true
    }
  });
};


/**
 *  Creates a simple token
 */

utils.getToken = function getToken() {

  return rand().toString(36).substr( 2, 10 );
};


/**
 *  Creates a secure random user ID
 *  (see: @broofa - http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523 )
 */

utils.createUID = function createUID() {

  var pool = new Uint8Array( 1 ),

    random, value,

    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function ( c ) {

      random = crypto.getRandomValues( pool )[0] % 16;

      value = ( c === 'x' ) ? random : (random&0x3|0x8);

      return value.toString(16);
    });

  return id;
};


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
 *  Converts parameter into a querystring
 *
 *  @param {Object} params   -
 */

utils.createQuery = function ( params ) {

  if ( typeof params != 'object' ) return;

  var keys = Object.keys( params ),
      query = [];

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    query[i] = params[keys] + '/';
  }

  return query.join('');
};


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

var getKeys = Object.keys;

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

            value = utils.extend( getReactor( function ( inner, value ) {

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
 *  Queue
 *  =====
 *
 *  Storing commands on a list for future execution.
 */


/**
 *  Constructor to define the container and initial state
 */

var Queue = function(){

  this.ready  = false;

  this.list   = [];
};


/**
 *  Add functions to the list
 *
 *  @param  {Function} fn   - function to be on the queue
 */

Queue.prototype.add = function ( fn ) {

  if ( typeof fn === 'function' ) {

    this.list.push( fn );
  }
};


/**
 *  Execute stored functions
 */

Queue.prototype.exec = function() {

  this.ready = true;

  var args = Array.prototype.slice.call( arguments ),

      list = this.list;

  while ( list.length ) list.pop().apply( null, args );
};


/**
 *  Empty the list of the queue
 */

Queue.prototype.clear = function(){

  this.list.length = 0;
};

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

utils.inherits( Stream, Emitter );


/**
 *  Delegates the action for the data (chunk or message)
 *
 *  @param  {Object} e   -
 */

Stream.prototype.handle = function ( e ) {

  var msg     = e.data,

      data    = JSON.parse( msg ),

      buffer  = this.readBuffer;


  if ( data.part !== void 0 ) {

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

      buffer  = data; //utils.StringToBuffer( data );


  if ( buffer.length > config.channelConfig.MAX_BYTES ) {
  // if ( buffer.byteLength > config.channelConfig.MAX_BYTES ) {

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

  var maxBytes  = config.channelConfig.MAX_BYTES,
      chunkSize = config.channelConfig.CHUNK_SIZE,
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
 *  Default
 *  =======
 *
 *  Default Handler for common tasks - e.g. establish a mesh network.
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

        account : INSTANCE.account,
        time    : INSTANCE.time,
        data    : INSTANCE.data,                // TODO: 0.6.0 -> define values for secure access
        list    : Object.keys( CONNECTIONS )
      });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],
          data = msg.data;

      utils.extend( peer.data, data.data );

      peer.time    = data.time;
      peer.account = data.account;

      Manager.check( data.list, this  );
      Manager.setup( this.info.remote );
    },

    close: function ( msg ) {  /* console.log('[DatChannel closed]'); */ }
  },


  /**
   *  Remote delegation for register another peer
   *
   *  @param {Object} msg   -
   */

  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== INSTANCE.id ) {  // proxy -> info.transport

      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      // TODO: 0.5.0 -> Bug fixes
      if ( !CONNECTIONS[ msg.remote ] ) return console.log('[ERORR] - Missing', msg.remote );

      return CONNECTIONS[ msg.remote ].send( 'register', msg.data, proxy );
    }

    if ( msg.action === 'update' ) return console.log('[ERROR] - Update', msg );

    Manager.set( msg, this );
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

    Manager.setup( msg.local, data.index, data.pong );
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

    pg.peers[ msg.local ].data[ msg.data.key ] = msg.data.value;

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

    INSTANCE.emit( 'message', msg );
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


var socketQueue = new Queue();

var socket = (function(){

  // initial
  logout();

  // close for SSE
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

    if ( checkProtocol('ws') || SERVERLESS ) {

      socketQueue.ready = true;
      return;
    }


    if ( SESSION.id ) {

      // XHR
      var msg = { action: 'remove', data: SESSION.id };

      send( msg, function(){

        // beforeunload callback
        if ( !socketQueue.ready ) {

          delete SESSION.id;

          socketQueue.exec();
        }
      });

    } else {

      socketQueue.exec();
    }
  }


  /**
   *  Set the session based ID and defines callbacks for server connection
   *
   *  @param {String}   id       -
   *  @param {String}   origin   -
   *  @param {Function} next     -
   */

  function init ( id, origin, next ) {

    SESSION.id = id;

    connectToServer( id, origin, function(){

      send({ action: 'lookup' }, function ( remoteID ) {  next( remoteID ); });
    });
  }


  var socket = null;

  /**
   *  Establish a WebSocket or EventSource connection
   *
   *  @param {String}   id       -
   *  @param {String}   origin   -
   *  @param {Function} next     -
   */

  function connectToServer ( id, origin, next ) {

    var Socket = checkProtocol('http') ? EventSource : WebSocket;

    socket = new Socket( config.socketConfig.server + '/?local=' + id + '&origin=' + origin );

    socket.addEventListener( 'error' , handleError );

    socket.addEventListener( 'open'  , function(){

      socket.addEventListener( 'message', handleMessage );
      socket.addEventListener( 'close'  , handleClose   );

      next();
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

      return ( socketQueue.list.length ) ? socketQueue.exec( msg ) : Manager.check( msg );
    }

    Manager.set( msg );
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

    utils.extend( msg, { local: INSTANCE.id, origin: INFO.route });

    msg = JSON.stringify( msg );

    if ( checkProtocol('http') ) {

      req( msg, next );

    } else {  // WS

      if ( next ) socketQueue.add( next );

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

    init    : init,
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

        Manager.disconnect( this.info.remote );
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

      var proxy = { action: action, local: INSTANCE.id, remote: remote };

      return this.info.transport.send( 'register', data, proxy );
    }

    if ( action === 'update' ) return console.log('[ERROR] - Update', data );

    socket.send({ action: action, data: data, remote: remote });
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

    while ( length-- ) crypto.push( utils.getToken() );

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

  var msg = { action: channel, local: INSTANCE.id, data: data, remote: this.info.remote };

  utils.extend( msg, proxy );

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

/**
 *  Manager
 *  =======
 *
 *  Helper for handling connections and delegate communication.
 */


var DELAY = 100,  // TODO: 0.5.0 -> Math.max() of latency evaluation

    READY =  {};  // record of current ready users



/** Module Pattern **/

var Manager = (function(){


  /**
   *  Check list for new connections
   *
   *  @param  {Array}  remoteList   -
   *  @param  {Object} transport    -
   */

  function check ( remoteList, transport ) {

    if ( !remoteList ) return;

    if ( !Array.isArray(remoteList) ) remoteList = [ remoteList ];

    var localID  = INSTANCE.id,

        remoteID;

    for ( var i = 0, l = remoteList.length; i < l; i++ ) {

      remoteID = remoteList[i];

      if ( remoteID !== localID && !CONNECTIONS[ remoteID ] ) {

        connect( remoteID, true, transport );
      }
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

    if ( CONNECTIONS[ remoteID ] ) return;

    // console.log( '[connect] to - "' + remoteID + '"' );

    pg.peers[ remoteID ]    = new Peer({ id: remoteID });

    CONNECTIONS[ remoteID ] = new Connection( INSTANCE.id, remoteID, initiator, transport );
  }


  /**
   *  Clear references, triggers callbacks and re-orders on disconnection of a peer
   *
   *  @param {String} remoteID   -
   */

  function disconnect ( remoteID ) {

    var peer = pg.peers[ remoteID ];


    delete READY[ remoteID ];

    INSTANCE.emit( 'disconnect', peer );
    ROOM    .emit( 'leave'     , peer );


    CONNECTIONS[ remoteID ].close();

    pg.data.splice( peer.pos, 1 );

    delete pg.peers[ remoteID ];
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

    if ( !CONNECTIONS[ msg.local] ) connect( msg.local, false, transport );

    CONNECTIONS[ msg.local ][ msg.action ]( msg.data );
  }


  /**
   *  Inform peers about key/value change by multicast
   *
   *  @param  {String}               key     -
   *  @param  {String|Number|Object} value   -
   */

  function update ( key, value ) {

    var ids = Object.keys( CONNECTIONS );

    for ( var i = 0, l = ids.length; i < l; i++ ) {

      CONNECTIONS[ ids[i] ].send( 'update', { key: key, value: value });
    }
  }


  var timer   = {};

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

    if ( --col[0] > 0 ) return;

    pg.peers[ remoteID ].latency = col.reduce( sum ) / ( col.length - 1 );

    order();

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

        num  = 100,

        col = timer[ remoteID ] = [ num ];

    for ( var i = 1; i <= num; i++ ) { col[i] = win.performance.now(); test( i ); }

    function test( i ) {

      setTimeout( function(){ conn.send( 'ping', { index: i }); }, rand() * num );
    }
  }


  /**
   *  Defines the peer order - ranked by the appearance / inital load
   */

  function order(){

    var keys = Object.keys( pg.peers ),

        times = {};

    times[ INSTANCE.time ] = INSTANCE.id;

    for ( var i = 0, l = keys.length; i < l; i++ ) times[ pg.peers[ keys[i] ].time ] = keys[i];

    var list = Object.keys( times ).sort( rank ).map( function ( key ) { return times[key]; }),

        user;

    if ( list.length !== keys.length + 1 ) {

      return console.log('[ERROR] Precision time conflict.', list, keys );
    }

    pg.data.length = 0;

    for ( i = 0, l = list.length; i < l; i++ ) {

      user     = pg.peers[ list[i] ] || INSTANCE;

      user.pos = pg.data.push( user.data ) - 1;
    }

    function rank ( curr, next ) { return curr - next; }
  }


  /**
   *  Determines if all peers are connected and then emits the connections
   */

  function ready(){

    var keys  = Object.keys( pg.peers ),

        list  = [],

        peer;

    list[ INSTANCE.pos ] = INSTANCE;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      peer = pg.peers[ keys[i] ];

      if ( !peer.time ) return;

      list[ peer.pos ] = peer;
    }


    /** emit users in order & prevent multiple trigger **/
    for ( i = 0, l = list.length; i < l; i++ ) setTimeout( invoke, DELAY, list[i] );

    function invoke( peer ) {

      if ( READY[ peer.id ] ) return;

      READY[ peer.id ] = true;

      INSTANCE.emit( 'connection', peer );
      ROOM    .emit( 'enter'     , peer );
    }
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


/**
 *  Public interface to access general information
 *
 *  @type {Object}
 */

pg.info = INFO = {

  route: null
};

// TODO: 0.6.0 -> data & info

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
  // 'GOOGLE'
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

pg.login = function ( name, service, hook ) {

  if ( typeof service === 'function' ) { hook = service; service = null; }

  if ( service ) return requestOAuth( name, service, hook );

  var account = { name: name };

  createPlayer( account, hook );
};


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

  var  account = { name: name };

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

  var origin = win.location.hash.substr(3) || DEFAULT_ROUTE.substr(1);

  pg.player = INSTANCE = new Player( account, origin );

  if ( hook ) hook( INSTANCE );

  INSTANCE.join( origin );
}

/**
 *  Router
 *  ======
 *
 *  Matching the browser URL to specific routes for handling rooms (channel or game).
 */


var channelRoutes =        {},  // collection of the channel routes

    gameRoutes    =        {},  // collection of the game routes

    LAST_ROUTE    =      null,  // reference to the last route

    DEFAULT_ROUTE = '/lobby/';


/**
 *  Defines custom routes or changes the default path
 *
 *  @param  {Object} customRoutes   -
 *  @param  {String} defaultRoute   -
 *  @return {Array}
 */

pg.routes = function ( customRoutes, defaultRoute ) {

  if ( !defaultRoute && typeof customRoutes === 'string' ) {

    defaultRoute = customRoutes;
    customRoutes = null;
  }

  if ( customRoutes ) defineCustomRoutes( customRoutes );
  if ( defaultRoute ) DEFAULT_ROUTE = defaultRoute;

  return [ channelRoutes, gameRoutes, DEFAULT_ROUTE ];
};


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

  var path    = win.location.hash.substr(3),
      args    = path.split('/');

  INFO.route = SESSION.currentRoute = path;

  if ( args.length < 1 ) return;

  // TODO: 0.7.0 -> customRoutes
  // if ( Object.keys( CUSTOM_PATTERNS ).length ) extractRoute();

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

    win.location.hash = '!/' + DEFAULT_ROUTE.substr(1);

    return;
  }

  ROOM = room = !args[0].length ? CHANNELS[ room ] || CHANNELS[ '*' ]  :
                                     GAMES[ room ] ||    GAMES[ '*' ]  ;

    var params = args; // TODO: 0.7.0 -> parse for custom routes

  if ( LAST_ROUTE === INFO.route ) return;

  if ( room ) {

    if ( LAST_ROUTE  ) {

      var keys = Object.keys( CONNECTIONS );

      for ( var i = 0, l = keys.length; i < l; i++ ) Manager.disconnect( keys[i] );

      socket.send({ action: 'change', data: LAST_ROUTE });
    }

    LAST_ROUTE = INFO.route;

  } else {

    throw new Error('Missing channel/game handler !');
  }
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
 *  Channel
 *  =======
 *
 *  An intermediate room for conversations.
 */


/**
 *  Public interface for setting up a channel
 */

pg.channel = createRoom( Channel );


var CHANNELS = {};  // record of channels


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

utils.inherits( Channel, Emitter );


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

  utils.extend( this.options, customConfig );
};


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
 *  Game
 *  ====
 *
 *  A room for handling gaming specific requirements.
 */


/**
 *  Public interface for setting up a game
 */

pg.game = createRoom( Game );


var GAMES   = {},     // record of games

    STARTER = null;   // bootstrap to forward the game start


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

utils.inherits( Game, Channel );


/**
 *  Starts the game as the minimum amount of players joined
 *
 *  @param {Function} initialize   - bootstrapping function to start the game
 */

Game.prototype.start = function ( initialize ) {

  this._start = function(){ initialize(); forward.call( this ); };


  var ready = Object.keys( READY ).length;

  if ( ready  <  this.options.minPlayer ) return;     // less player  - wait

  if ( ready === this.options.minPlayer ) {

    if ( INSTANCE.pos === 0 ) this._start();

    return;
  }

  if ( ready  >  this.options.minPlayer ) {          // more player   - late join

    if ( INSTANCE.pos >= this.options.minPlayer ) request();

    return;
  }

  // TODO: 0.5.0 -> maxPlayer will be handled
};


Game.prototype.end      = function(){};  // TODO: 0.6.0 -> player handling

Game.prototype.pause    = function(){};  // TODO: 0.6.0 -> player handling

Game.prototype.unpause  = function(){};  // TODO: 0.6.0 -> player handling



/**
 *  Ask the previous peer if your allowed/ready to start | late-join
 */

function request() {

  var keys = Object.keys( pg.peers ),
      curr = INSTANCE.pos;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    if ( curr - 1 === pg.peers[ keys[i] ].pos ) {

      return CONNECTIONS[ keys[i] ].send( 'start', { request: true });
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

      var keys = Object.keys( pg.peers ),
          curr = INSTANCE.pos;

      for ( var i = 0, l = keys.length; i < l; i++ ) {

        if ( curr + 1 === pg.peers[ keys[i] ].pos ) {

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

      keys = Object.keys( pg.sync ),

      prop;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    prop = keys[i];

    conn.send( 'sync', { resync: true, key: prop, value: pg.sync[prop] });
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

utils.inherits( Media, Connection );


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


pg.peers = {}; // collection of all connected peers

pg.data  = []; // shortcut to access the stored data


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

utils.inherits( Peer, Emitter );


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

  this.pos     = pg.data.push( this.data ) - 1;

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

pg.player = { on: function ( channel, callback, context ) {

  if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

  callbackRefs[ channel ].push([ callback, context ]);

}};


/**
 *  Constructor to define the basic setup
 *
 *  @param  {Object} account   -
 *  @param  {String} origin    - current path (URL fragment)
 */

var Player = function ( account, origin ) {

  var id    = utils.createUID(),

      data  = getReactor( Manager.update );

  this.time = Date.now();

  this.init( id, account, data );

  if ( Object.keys( callbackRefs ).length ) eventMap[ this.id ] = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  if ( SERVERLESS ) return setImmediate(function(){ Manager.check([ 'SERVERLESS' ]); });


  /** Executes after logout & socket creation **/

  var register = function(){ socket.init( id, origin, Manager.check ); };

  if ( socketQueue.ready ) return register();

  socketQueue.add( register );
};


/**
 *  Player <-- Peer
 */

utils.inherits( Player, Peer );


/**
 *  Change URL to trigger routes for channel or games
 *
 *  @param  {String|Number} channel [description]
 *  @param  {Object}        params  [description]
 */

Player.prototype.join = function ( channel, params ) {

  if ( typeof channel !== 'string' ) channel = channel.toString();

  if ( channel.charAt(0) === '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, utils.createQuery( params ) ].join('');

  if ( path.charAt( path.length - 1 ) !== '/' ) path += '/';

  if ( path === '!/' + SESSION.currentRoute ) return checkRoute();

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

  if ( !list ) list = Object.keys( CONNECTIONS );

  if ( !Array.isArray( list ) ) list = [ list ];

  for ( var i = 0, l = list.length; i < l; i++ ) {

    CONNECTIONS[ list[i] ].send( 'message', { local: this.name, msg: msg });
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
 *  Loop
 *  ====
 *
 *  Game loop wrapper for continuous processing.
 */


/**
 *  Public interface to start the rendering
 *
 *  @type {Function}
 */

pg.loop = loop;


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

  // ROOM.emit( 'pause', INSTANCE ); // send 'pause' to others as well
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

pg.sync = getReactor( batch(sync) );


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

    var keys = Object.keys(list),

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

    if ( !CACHE[key] || CACHE[key].results[ INSTANCE.pos ] !== value ) {

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

  var ids = Object.keys( CONNECTIONS );

  // TODO: 0.6.0 -> conflict with multiple ?
  CACHE[key] = { list: ids, results: [] };

  CACHE[key].results[ INSTANCE.pos ] = value;

  for ( var i = 0, l = ids.length; i < l; i++ ) {

    CONNECTIONS[ ids[i] ].send( 'sync', { key: key, value: value });
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

  if ( !CACHE[key] ) { // noConflict

    sync( key, value, true );

    return CONNECTIONS[ remoteID ].send( 'sync', { resync: true, key: key, value: value });
  }

  // TODO: 0.6.0 -> handle conflict (lower pos)
  console.log('[CONFLICT]');

  // var entry = CACHE[key];

  // entry.list.length -= 1;

  // entry.results[ pg.peers[remoteID].pos ] = value;

  // if ( entry.list.length ) return;
}



	return pg;
});
