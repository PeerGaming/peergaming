/**
 *	peergaming.js - v0.3.0 | 2013-05-16
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
 *
 */


// global shortcuts

var win = window,

    moz     = !!navigator.mozGetUserMedia,

    SESSION = win.sessionStorage;



// Protocol


// internal variables

var instance,          // Singleton reference

    LOOP_TIME  = 100;  // 100ms      // SYNC_DELAY (dynamcly changed by the manager - regarding connections)


// Error Messages

/**
 *  Adapter
 *  =======
 *
 *  Normalize different browser behavior.
 */


/**
 *  Performance
 */

if ( !win.performance ) {

  win.performance = { now: Date().now() };

} else if ( !win.performance.now ) {

  win.performance.now = win.performance.webkitNow;
}


/**
 *  requestAnimationFrame
 */

if ( !win.requestAnimationFrame ) {

  var vendors = [ 'webkit', 'moz' ];

  for ( var i = 0, l = vendors.length; i < l && !win.requestAnimationFrame; i++ ) {

    win.requestAnimationFrame = win[ vendors[i] + 'RequestAnimationFrame' ];
    win.cancelAnimationFrame  = win[ vendors[i] + 'CancelAnimationFrame' ]        ||
                                win[ vendors[i] + 'CancelRequestAnimationFrame' ];
  }
}


/**
 *  Blob & ObjectURL
 */

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


/**
 *  setImmediate
 */

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


/**
 *  User Media Stream
 */

if ( !navigator.getUserMedia ) {

  navigator.getUserMedia =  navigator.mozGetUserMedia     ||
                            navigator.webkitGetUserMedia  ||
                            navigator.msGetUserMedia;
}


/**
 *  PeerConnection
 */

if ( typeof win.RTCPeerConnection !== 'function' ) {    // FF has already some stubs...

  win.RTCPeerConnection = win.mozRTCPeerConnection    ||
                          win.webkitRTCPeerConnection;
}


// Firefox handling
if ( typeof win.RTCSessionDescription !== 'function' ) {

  win.RTCSessionDescription = win.mozRTCSessionDescription;
}


if ( typeof win.RTCIceCandidate !== 'function' ) {

  win.RTCIceCandidate = win.mozRTCIceCandidate;
}


// Chrome handling
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
 *
 *  ToDo:
 *
 *  - DataChannel
 *  - ServerSent Events/WebSocket
 */


var reliable  = false,

    features  = [ 'URL', 'Blob', 'crypto', 'indexedDB', 'RTCPeerConnection' ];

for ( var i = 0, l = features.length; i < l; i++ ) {

  if ( !(features[i] in win ) ) console.log( 'Missing: ', features[i] );
}

if ( !win.RTCPeerConnection ) throw new Error('Your browser doesn\'t support PeerConnections yet.');


var littleEndian = (function(){

    var arr32   = new Uint32Array(1),
        arr8    = new Uint8Array( arr32.buffer );

    arr32[0] = 255;

    return !!arr8[0];   // 255 0 0 - litte  ||  0 0 255 - big
})();

/**
 *  Debug
 *  =====
 *
 *  Debugging calls for development.
 */


/**
 *  log
 *
 *  Log information - display the text in a structured manner !
 *  @return {[type]} [description]
 */

function debug ( text ) {

	if ( !instance || !localStorage.log ) {

		localStorage.log = 0;
	}

	if ( text[text.length - 1] === '\n' ) {

		text = text.substring( 0, text.length - 1 );
	}

	var num = ++localStorage.log,
		msg = '(' + num + ') - ' + ( (performance.now()) / 1000 ).toFixed(3) + ': ' + text;

	console.log( msg );
}

win.clearDebug = function() {

	delete localStorage.log;
};


/**
 *  logger
 *
 *  Logging errors
 *  @param  {[type]} err [description]
 *  @return {[type]}     [description]
 */
function loggerr ( err )  {

	console.log('[error]');
	console.log( err , err.name + ': ' + err.message );
}


/**
 *  Check debugging state
 *
 *	See https://github.com/adamschwartz/chrome-inspector-detector and
 *  http://stackoverflow.com/questions/7527442/how-to-detect-chrome-inspect-element-is-running-or-not/15567735#15567735
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


// extend profiler - http://smnh.me/javascript-profiler/


// stopbefore

// https://gist.github.com/NV/5376464

/**
 *  Base
 *  ====
 *
 *  Basic wrapper definition.
 */

var reservedReference = context.pg,

    pg = Object.create( null );

/**
 *  [VERSION description]
 *
 *  Information about the framework version.
 *  @type {Object}
 */

pg.VERSION = {

  codeName    : 'salty-goblin',
  full        : '0.3.0',
  major       : 0,
  minor       : 3,
  dot         : 0
};



/**
 *  [noConflict description]
 *
 *  Restore and provide the last reference of the namespace 'pg'.
 *  @return {[type]} [description]
 */

pg.noConflict = function(){

  context.pg = reservedReference;

  return this;
};

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


/**
 *  Misc
 *  ====
 *
 *  Collection of simple helpers.
 */


var utils = {};


// improved typeof
utils.check = function ( obj ) {

  return Object.prototype.toString.call( obj ).slice( 8, -1 );
};


/**
 *  Extends properties of an Object.
 *
 *  @param  {[type]} target [description]
 *  @return {[type]}        [description]
 */

utils.extend = function extend ( target ) {

  var source, key;

  for ( var i = 1, length = arguments.length; i < length; i++ ) {

    source = arguments[i];

    for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
  }

  return target;
};


// form original nodejs
// https://github.com/joyent/node/blob/master/lib/util.js

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


utils.getToken = function getToken() {

  return Math.random().toString(36).substr( 2, 10 );
};


// Based on @broofa:
// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523

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



// String/Buffer Conversion
// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String

utils.StringToBuffer = function StringToBuffer ( str ) {

  var buffer  = new ArrayBuffer( str.length * 2 ), // 2 bytes per char
      view    = new Uint16Array( buffer );

  for ( var i = 0, l = str.length; i < l; i++ ) {

    view[i] = str.charCodeAt(i);
  }

  return buffer;
};


utils.BufferToString = function BufferToString ( buffer ) {

  return String.fromCharCode.apply( null, new Uint16Array( buffer ) ) ;
};


// ToDo:
//
// - check & decide of proper query stringfication

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
 *  An "reactive" object, which notifies it's subscribers as properties got changed.
 *
 *  ToDo:
 *
 *  - check if multiple reactors receive different IDs and are therefore seperated
 */


// record of reactors
var list = [];


/**
 *  [getReactor description]
 *  @return {[type]} [description]
 */

var getReactor = function() {

  var args = [], obj = Object.create( Object.prototype );

  args.push.apply( args, arguments );

  list.push({ reference: {}, callbacks: args });

  checkProperties( list.length - 1, obj );

  return obj;
};



/**
 *  [checkProperties description]
 *
 *  @param  {[type]} id      [description]
 *  @param  {[type]} current [description]
 *  @return {[type]}         [description]
 */

function checkProperties ( id, current ) {

  var last    = list[id].reference,
      diff    = getDifferences( last, current ),

      add     = diff.add,
      remove  = diff.remove,

      i, l;


  // add - watching | unwatch - remove
  if ( add.length || remove.length ) {

    for ( i = 0, l = add.length; i < l; i++ ) defineProperty( id, current, add[i] );

    for ( i = 0, l = remove.length; i < l; i++ ) delete last[ remove[i] ];
  }

  setTimeout( checkProperties, LOOP_TIME, id, current );
}


/**
 *  [getDifferences description]
 *  @param  {[type]} last    [description]
 *  @param  {[type]} current [description]
 *  @return {[type]}         [description]
 */

var getKeys = Object.keys;

function getDifferences ( last, current ) {

  var lastKeys    = getKeys( last ),
      currentKeys = getKeys( current ),

      add         = [],
      remove      = [],

      i, l;

  for ( i = 0, l = lastKeys.length; i < l; i++ ) {

    if ( !current[ lastKeys[i] ] ) remove.push( lastKeys[i] );
  }

  for ( i = 0, l = currentKeys.length; i < l; i++ ) {

    if ( !last[ currentKeys[i] ] ) add.push( currentKeys[i] );
  }

  return { add: add, remove: remove };
}



/**
 *  [defineProperty description]
 *  @param  {[type]} id      [description]
 *  @param  {[type]} current [description]
 *  @param  {[type]} prop    [description]
 *  @return {[type]}         [description]
 */

function defineProperty ( id, current, prop ) {

  var getter = function() { return list[id].reference[ prop ]; },

      setter = function ( value ) {

        // change in the reference model as well
        list[id].reference[ prop ] = value;

        var callbacks = list[id].callbacks,

            i, l;

        for ( i = 0, l = callbacks.length; i < l; i++ ) {

          callbacks[i].apply( callbacks[i], [ prop, value ] );
        }

        return value;
      };


  // initial call + set diff
  setter( current[prop] );


  // setup watcher
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
 *  Storing commands on a list - executing them later.
 */

/**
 *  queue
 *
 *  Pushing actions on to a list.
 *  @param  {Function} fn [description]
 *  @return {[type]}      [description]
 */

var Queue = (function(){


  var Queue = function(){

    this.ready  = false;

    this.list   = [];
  };


  /**
   *  add a function to the list
   *  @param {Function} fn [description]
   */

  Queue.prototype.add = function ( fn ) {

    if ( typeof fn === 'function' ) {

      this.list.push( fn );
    }
  };


  /**
   *  Execute the stored functions
   *  @return {[type]} [description]
   */

  Queue.prototype.exec = function() {

    this.ready = true;

    var args = Array.prototype.slice.call( arguments ),

        list = this.list;

    while ( list.length ) list.pop().apply( null, args );
  };


  Queue.prototype.clear = function(){

    this.list.length = 0;
  };

  return Queue;

})();


/**
 *  Event
 *  =====
 *
 *  Message handling using a Mediator (publish/subscribe).
 */

var Emitter = (function(){

  'use strict';


  /**
   *  Constructor
   */

  var EventEmitter = function(){

    this._events = {};

    return this;
  };


  /**
   * Register callbacks to topics.
   *
   * @param  {string}   topics  - topics to subscribe
   * @param  {function} callback  - function which should be executed on call
   * @param  {object}   context - specific context of the execution
   */

  EventEmitter.prototype.on = function ( topics, callback, context ) {

    if ( typeof callback !== 'function' ) return;

    topics = topics.split(' ');

    var events  = this._events,
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
   *  [once description]
   *  @param  {[type]}   topics   [description]
   *  @param  {Function} callback [description]
   *  @param  {[type]}   context  [description]
   *  @return {[type]}            [description]
   */

  EventEmitter.prototype.once = function ( topics, callback, context ) {

    this.on( topics, function once() {

      this.off( topics, once );
      // this.off( type, once );

      callback.apply( this, arguments );

    }.bind(this));

    return this;
  };


  /**
   * Send data to subscribed functions.
   *
   * @param  {string}   topic   - topic to send the data
   * @params  ......    arguments - arbitary data
   */

  EventEmitter.prototype.emit = function ( topic ) {

    var events    = this._events,
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
   * Unsubscribe callbacks from a topic.
   *
   * @param  {string}   topic   - topic of which listeners should be removed
   * @param  {function} callback  - specific callback which should be removed
   */

  EventEmitter.prototype.off = function ( topic, callback ) {

    var events    = this._events,
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


  return EventEmitter;

})();

/**
 *  Stream
 *  ======
 *
 *  Interface for streaming activities.
 */


var Stream = (function(){

  'use strict';

  var Stream = function ( options ) {

    Emitter.call(this);

    if ( !options ) options = {};

    this.readable   = options.readable;
    this.writeable  = options.readable;

    this.ready      = true;
    // this.offset    = 0;            // current offset - used to merge chunks ?

    this.writeBuffer  = [];
    this.readBuffer   = [];
  };


  utils.inherits( Stream, Emitter );


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


  // ToDo:  check if others are empty - open ,
  //      else push on queue and wait till finish !
  // stream has to handle readystate etc.

  Stream.prototype.write = function ( msg ) {

    this.writeBuffer.push( msg );

    if ( this.ready ) {

      this.emit( 'write', this.writeBuffer.shift() );

    } else {

      // handle simoultanous accessing - using queue, messages etc.
    }

    return this.ready;
  };


  Stream.prototype.pipe = function ( trg ) {

    this.on('data', function ( chunk ) {

      trg.handle( chunk );
    });

    return trg;
  };

  return Stream;

})();


/**
 *  Handler
 *  =======
 *
 *  Delegating through error - close, messaging events. // // handler for a new channel
 */


var Handler = (function(){

// if ( options ) customHandlers[ label ] = options;

  var Handler = function ( channel, remote ) {  // remote not required, as already assigned

    var label   = channel.label;

    this.info   = {

      label : label,
      remote  : remote
    };


    this.channel  = channel;

    this.stream   = new Stream({ readable: true, writeable: true });


    this.actions  = defaultHandlers[ label ] || defaultHandlers.custom;

    if ( typeof this.actions === 'function' ) this.actions = { end: this.actions };

    channel.addEventListener( 'open', this.init.bind(this) );
  };


  Handler.prototype.init = function ( e ) {

    // console.log('[open] - '  + this.label );

    var channel     = this.channel,

        actions     = this.actions,

        stream      = this.stream,

        connection  = instance.connections[ this.info.remote ],

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


  // currently still required to encode arraybuffer to to strings...
  // // Using Strings instead an arraybuffer....
  Handler.prototype.send = function ( msg ) {

    var data    = JSON.stringify( msg ),

        buffer  = data; //utils.StringToBuffer( data );


    if ( buffer.length > config.channelConfig.MAX_BYTES ) {
    // if ( buffer.byteLength > config.channelConfig.MAX_BYTES ) {

      buffer = createChunks( buffer );  // msg.remote...

    } else {

      buffer = [ buffer ];
    }

    for ( var i = 0, l = buffer.length; i < l; i++ ) {

      this.stream.write( buffer[i] );
    }
  };


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
        i = 0;        // increment

    while ( l-- ) {

      chunks[l] = JSON.stringify({ part: i++, data: chunks[l] });
    }

    return chunks;
  }


  return Handler;

})();

/**
 *  Default
 *  =======
 *
 *  Default Handler for common task (e.g. estbalish mesh network).
 *  Context will be the on of the connection ? or like before from the handler ?
 */

// custom handler collection

// var customHandlers = {};
// customHandlers[ label ] ||

var defaultHandlers = {

  init: {

    open: function() {

      // channel established && open
      delete this.info.pending;

      this.send( 'init', { name: instance.account.name, list: Object.keys( instance.connections ) });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],

          data = msg.data;

      utils.extend( peer, { account: { name: data.name } });

      instance.emit( 'connection', peer );

      // ToDo: refactor with .connect()
      // providing transport - register delegation
      instance.checkNewConnections( data.list, this );
    },

    close: function ( msg ) {

      console.log('[closed]');

      console.log(msg);
    }

  },


  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== instance.id ) {  // proxy || same as info.transport

      // just handler between - setting up for remote delegation
      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      return instance.connections[ msg.remote ].send( 'register', msg.data, proxy );
    }

    if ( !instance.connections[ msg.local ] ) instance.connect( msg.local, false, this );

    instance.connections[ msg.local ][ msg.action ]( msg.data );
  },


  // here again: action can be called for remote handling...
  custom: function ( msg ) {

    console.log('[channel doesn\'t exist yet - local delegation');

    msg = JSON.parse( msg );

    console.log(msg.action);
  },


  message: function ( msg ) {

    instance.emit( 'message', msg );
  }

};

/**
 *  Socket
 *  ======
 *
 *  Transport layer used to communicate with the server.
 *
 *  First using WebSocket or XHR - later replaced through the specific DataChannel reference.
 */


var socketQueue = new Queue();

var socket = (function(){

  'use strict';

  // initial
  logout();

  // close for SSE
  win.addEventListener('unload',            logout );
  win.addEventListener('beforeunload',      logout );


  /**
   *  [req description]
   *
   *  Request for EventSource / Polling
   *  @param  {[type]}   msg  [description]
   *  @param  {Function} next [description]
   *  @return {[type]}        [description]
   */

  function req ( msg, next ) {

    // ToDo: pooling the request objects
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
   *  [logout description]
   *
   *  Remove ID from the server.
   *  @param  {[type]} e [description]
   *  @return {[type]}   [description]
   */

  function logout() {

    // WS
    if ( checkProtocol('ws') ) {

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
   *  [init description]
   *
   *  Register on the server.
   *  @param  {[type]}   id   [description]
   *  @param  {Function} next [description]
   *  @return {[type]}        [description]
   */

  function init ( id, origin, next ) {

    SESSION.id = id;

    connectToServer( id, origin, function(){

      send({ action: 'lookup' }, function ( remoteID ) {  next( remoteID ); });
    });
  }


  /**
   *  [listenToServer description]
   *
   *  Attach Server
   *  @param  {[type]}   id   [description]
   *  @param  {Function} next [description]
   *  @return {[type]}        [description]
   */

  var socket;

  function connectToServer ( id, origin, next ) {

    function handleOpen() { next(); }

    var Socket = checkProtocol('http') ? EventSource : WebSocket;

    socket = new Socket( config.socketConfig.server + '/?local=' + id + '&origin=' + origin );

    socket.addEventListener( 'open'     , handleOpen );
    socket.addEventListener( 'message'  , handleMessage );
    socket.addEventListener( 'error'    , handleError );
  }


  /**
   *  [handleMessage description]
   *
   *  Interface for parsing messages.
   *  @param  {[type]} e [description]
   *  @return {[type]}   [description]
   */

  function handleMessage ( e ) {

    var msg = JSON.parse( e.data );

    // receive partner via socket & call register
    if ( !msg || !msg.local ) return socketQueue.exec( msg );

    // create new reference
    if ( !instance.connections[ msg.local ] ) instance.connect( msg.local );

    // SDP & Candidates
    instance.connections[ msg.local ][ msg.action ]( msg.data );
  }


  /**
   *  [handleError description]
   *
   *  Handling errors.
   *  @param  {[type]} e [description]
   *  @return {[type]}   [description]
   */

  function handleError ( e ) {


    // XHR
    if ( e.eventPhase === EventSource.CLOSED ) {

      console.log('[close]');

    } else {

      throw new Error( e.data );
    }

    // socket
    e.currentTarget.close();

    logout();
  }

  /**
   *  [send description]
   *
   *  Sending messages throug the appropriate transport socket.
   *
   *  @param  {[type]} msg [description]
   *  @return {[type]}     [description]
   */

  function send ( msg, next )  {

    // just for server
    utils.extend( msg, { local: instance.id, origin: SESSION.currentRoute });

    msg = JSON.stringify( msg );

    if ( checkProtocol('http') ) { // XHR

      req( msg, next );

    } else {  // WS

      socketQueue.add( next );

      socket.send( msg );
    }
  }


  // required to check everytime/not just on inital start - as the configurations can be customized
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
 *  A wrapper for PeerConnections.
 */




var Connection = function ( local, remote, initiator, transport ) {

  this.info = {

    local   : local,
    remote  : remote,
    pending : true
  };

  if ( initiator ) this.info.initiator = true;
  if ( transport ) this.info.transport = transport;

  this.channels = {};

  this.init();
};


Connection.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

  this.checkStateChanges();

  this.receiveDataChannels();

  this.findICECandidates();

  if ( this.info.initiator ) {

    this.createOffer();
  }
};


Connection.prototype.checkStateChanges = function(){

  var conn    = this.conn,

      length  = Object.keys( defaultHandlers ).length;


  conn.onnegotiationneeded = function ( e ) {

    // console.log('[negotiation needed]');
    if ( !--length ) this.createOffer();

  }.bind(this);


  conn.oniceconnectionstatechange = function ( e ) {

    var iceState = e.currentTarget.iceConnectionState;

    // disconnected
    if ( iceState === 'disconnected' ) pg.peers[ this.info.remote ].remove();

  }.bind(this);


  conn.onsignalingstatechange = function ( e ) {

    // console.log('[state changed]');
    // var signalingState = e.currentTarget.signalingState;
    // console.log(signalingState);

  }.bind(this);
};


// receive remote created channel
Connection.prototype.receiveDataChannels = function(){

  this.conn.ondatachannel = function ( e ) {

    var channel = e.channel,

        label   = channel.label;

    this.channels[ label ] = new Handler( channel, this.info.remote );

  }.bind(this);
};


// find ICE candidates
Connection.prototype.findICECandidates = function(){

  this.conn.onicecandidate = function ( e ) {

    // var iceGatheringState = e.currentTarget.iceConnectionState;
    // console.log(iceGatheringState);

    // the 'null' candidate just because there isn't a onicegatheringcomplete event handler.

    if ( e.candidate ) {

      this.send( 'setIceCandidates', e.candidate );

    } else {

      // After ICE completion a callback with a null candidate is supplied.
      // console.log('iceGatheringState: completed');
    }

  }.bind(this);
};


// needs a description first !
Connection.prototype.setIceCandidates = function ( data ) {

  var conn = this.conn;

  if ( conn.remoteDescription || conn.localDescription ) {

    if ( this._candidates ) delete this._candidates;

    data = Array.isArray(data) ? data : [ data ];

    for ( var i = 0, l = data.length; i < l; i++ ) {

      conn.addIceCandidate( new RTCIceCandidate( data[i] ) );
    }

  } else {

    if ( !this._candidates ) this._candidates = [];

    this._candidates.push( data );
  }
};


Connection.prototype.createOffer = function() {

  var conn = this.conn;

  // initial setup channel for configuration
  if ( moz ) conn.createDataChannel('[moz]');

  conn.createOffer( function ( offer ) {

    offer.sdp = adjustSDP( offer.sdp );

    conn.setLocalDescription( offer, function(){

      this.send( 'setConfigurations', offer );

    }.bind(this) );

  }.bind(this), loggerr, config.mediaConstraints ); // 3.param || media contrain
};


// exchange settings
Connection.prototype.setConfigurations = function ( msg ) {

  // console.log('[SDP] - ' +  msg.type );  // description

  var conn = this.conn,

      desc = new RTCSessionDescription( msg );


  conn.setRemoteDescription( desc, function(){

    if ( this._candidates ) this.setIceCandidates( this._candidates );

    if ( msg.type === 'offer' ) {

      conn.createAnswer( function ( answer ) {

        answer.sdp = adjustSDP( answer.sdp );

        conn.setLocalDescription( answer, function(){

          this.send( 'setConfigurations', answer );

        }.bind(this), loggerr );//, config.SDPConstraints );

      }.bind(this), null, config.mediaConstraints );

    } else {

      createDefaultChannels( this );
    }

  }.bind(this), loggerr );
};


Connection.prototype.createDataChannel = function ( label, options ) {

  try {

    // var channel = this.conn.createDataChannel( label, moz ? {} : { reliable: false });
    var channel = this.conn.createDataChannel( label, { reliable: false });

    this.channels[ label ] = new Handler( channel, this.info.remote );

  } catch ( e ) { // getting: a "NotSupportedError" - but is working !

    console.log('[Error] - Creating DataChannel (*)');
  }
};


Connection.prototype.send = function ( action, data ) {  // msg

  // direct connection to the peer, established set through defaultHandler
  if ( !this.info.pending ) {


    this.send = function useChannels ( channel, data, proxy ) {

      var msg = { action: channel, local: instance.id, data: data, remote: this.info.remote };

      utils.extend( msg, proxy );


      var channels = this.channels;

      if ( !channel ) channel = keys = Object.keys( channels );

      if ( !Array.isArray( channel ) ) channel = [ channel ];

      // ToDo: closing issue
      // missing - message will be send - injected as , new icecandidates will be created etc.

      for ( var i = 0, l = channel.length; i < l; i++ ) {

        if ( channels[ channel[i] ] ) channels[ channel[i] ].send( msg );
      }

    }.bind(this);


    this.send( action, data );

  } else { // initializing handshake


    var remote = this.info.remote;

    // mesh work  // this.transport -> the connection ||  delegates to the call above !
    if ( this.info.transport ) {

      var proxy = { action: action, local: instance.id, remote: remote };

      return this.info.transport.send( 'register', data, proxy );
    }

    // send via server
    socket.send({ action: action, data: data, remote: remote });
  }
};


// closing by dev != disconnect
Connection.prototype.close = function( channel ) {

  var channels  = this.channels,
      keys      = Object.keys(channels);

  if ( !channel ) channel = keys;

  if ( !Array.isArray( channel ) ) {

    channel = [ channel ];
  }

  for ( var i = 0, l = channel.length; i < l; i++ ) {

    channels[ channel[i] ].close();
    delete channels[ channel[i] ];
  }
};


// @Sharefest
// modifying the SDP parameters for interoperability and bandwidth
// + // See RFC for more info: http://www.ietf.org/rfc/rfc2327.txt
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

      var size = config.channelConfig.BANDWIDTH;

      return 'b=AS:' + size;
    });
  }

  return sdp;
}


// create basic channels
function createDefaultChannels ( connection )  {

  // just once
  if ( Object.keys(connection.channels).length ) return;

  var defaultChannels = Object.keys( defaultHandlers );

  for ( var i = 0, l = defaultChannels.length; i < l ; i++ ) {

    connection.createDataChannel( defaultChannels[i] );
  }
}

/**
 *  Manager
 *  =======
 *
 *  Connection Manager, which handles the communication and data connections.
 */


// var manager


var Manager = {

  update: function ( key, value ) {


    console.log('[changed] ' + key + ': ' + value );
  }




};


// handles types of connection: data connection or media connection (the firstis based on datachannel,
//      the other on mediastream - which can be used to broadcast e.g. video streams)




  // function sendToServer ( action, data ) {

  // }


  // // every channel defines its own action
  // function sendToPeer ( channel, data ) {

  // }


/**
 *  Info
 *  ====
 *
 *  Simple interface to provide data for external storage.
 */


pg.info = {

  note: 'ToDo'
};

/**
 *  Login
 *  =====
 *
 *  can be used after handling authentication - wrapper to preset the Peer !
 *
 *  Can either be a string, which is then just a name, no external service will be used - or an
 *  secondary parameter with further credentials.
 *
 *  e.g.: 'name' or 'name', 'service'
 *
 *  // callback of "next" is also optional, as it wouldn't be required ||
 *   if it exists - will be called before the default join  ||
 *
 *
 *      additional hook can m
 *
 *  optional: hook && service (required just name etc.) ||
 */


pg.login = function ( name, service, hook ) {

  if ( typeof service === 'function' ) {

    hook    = service;
    service = null;
  }

  if ( service ) return requestOAuth( name, service, hook );

  var account = { name: name };

  createPlayer( account, hook );
};


// allow to login and use 3rd party data
function requestOAuth ( name, service, hook ) {

  var account = { name: name };

  createPlayer( account, hook );
}


// assign value
function createPlayer ( account, hook ) {

  var origin = win.location.hash.substr(3) || DEFAULT_ROUTE.substr(1);

  pg.player = instance = new Player( account, origin );

  if ( hook ) hook( instance );

  instance.join( origin );
}

/**
 *  Routes
 *  ======
 *
 *  Matching request/URL routes.
 *
 *
 *  ToDo:
 *
 *  - add History API support (see server side support)
 *
 *  - improve param splitting + channel / game recognition
 *
 *
 *  as of v2 using functions, easier as mostly the application itself will just need on hook,
 *  and not multiple (see demonstration, || there can be different routes, but else simpler !)
 *
 *  Example:
 *
 *    pg.routes(
 *
 *      // channel,
 *
 *      // game
 *    ) // 2 simple - or one objct for cunfiguraiton !
 *
 *		pg.routes({
 *
 *
 *		})
 */


// using the speeration of the channels, games ?s


var channelRoutes   = {},               // collection of the channel routes
    gameRoutes      = {},               // collection of the game  routes

    // CUSTOM_PATTERNS = null,             // custom Patterns (which are used for the customRoutes)

    // DEFAULT_CHANNEL = '/:channel/',
    // DEFAULT_GAME    = '/:game/:id/',
    DEFAULT_ROUTE   = '/lobby/';




// setting up routes

// optional setting, can provide a dictionary for custom routes + default route

pg.routes = function ( customRoutes, defaultRoute ) {

  if ( !defaultRoute && typeof customRoutes === 'string' ) { // less then 2 arguments

    defaultRoute = customRoutes;
    customRoutes = null;
  }

  if ( customRoutes ) defineCustomRoutes( customRoutes );
  if ( defaultRoute ) DEFAULT_ROUTE = defaultRoute;

  return [ channelRoutes, gameRoutes, DEFAULT_ROUTE ];
};


// var CHANNEL_PATTERN = /\/(.*?)\//g,
//     ARGS_PATTERN    = /(\?)?:\w+/g;

// TODO
function defineCustomRoutes ( customRoutes ) {

  channelRoutes = {};
  gameRoutes = {};
}




// parsing routing behavior


// extract params
function checkRoute() {

  var path    = win.location.hash.substr(3),
      args    = path.split('/');

  SESSION.currentRoute = path;

  if ( args.length < 1 ) return;

  // if ( Object.keys( CUSTOM_PATTERNS ).length ) extractRoute();

  matchRoute( args );
}


// execute wrapped function
// cann be a channel or game
function matchRoute ( args ) {

  var room = args.shift();

  if ( !room ) { // re-routing

    win.location.hash = '!/' + DEFAULT_ROUTE.substr(1);

    return;
  }

  // room match -> arguments, defined as a channel or game
  var match = !args[0].length ? channels[ room ] || channels[ '*' ]  :
                                   games[ room ] ||    games[ '*' ]  ;


  // TODO: parsed by custom routes
  var params = args;

  if ( match ) {

    match.call( match, params );

  } else {

    throw new Error('Missing channel/game handler !');
  }
}


// customRoute with specifc params
// function extractRoute() {

//   console.log('[ToDo] Extract Params');
// }


// attach listener
win.addEventListener( 'hashchange', checkRoute );

/**
 *  Channel
 *  =======
 *
 *  Channel as a room for conversations etc.
 *
 *
 *  Example:
 *
 *    pg.channel('example', function ( channel ) {
 *
 *      console.log(channel);
 *    });
 */


var channels = {};


var Channel = function ( id ) {

  Emitter.call( this );

  this.id = id;
};


utils.inherits( Channel, Emitter );



pg.channel = function ( id, handler ) {

  if ( typeof id !== 'string' ) {

    handler = id;
    id      = '*';
  }

  var channel = new Channel( id );

  // typeof handler => function
  channels[ id ] = createChannel( handler, channel );

  return channel;
};



function createChannel ( handler, channel ) {

  return function ( params ) {

    handler( channel, params );

    // you are entering....
    channel.emit( 'enter', instance );  // otherwise: peers[id]
  };
}


/**
 *  Game
 *  ====
 *
 *  Game room for handling game specific issues.
 *
 *
 *  Example:
 *
 *    pg.game('cool', function( game ){
 *
 *      console.log( game ); *
 *    });
 */


var games  = {};


var Game = function ( id ) {

  Emitter.call( this );

  this.id = id;

  this.config = {

    minPlayer: 2,
    maxPlayer: 8

    // watchable: true
    // public, privated.., protected...
  };

};


utils.inherits( Game, Channel );


Game.prototype.info = function(){

  var info = {

    currentPlayers: 2,
    state: 'running'
  };

  return info;
};


// check for role | voting,as start -end etc. shouldnt be callable by the users afterwards....

Game.prototype.start = function(){


};

Game.prototype.end = function(){


};

Game.prototype.pause = function(){


};

Game.prototype.unpause = function(){


};






// 1:1 mapping for channel , on refactoring, just regards the .games[ id], and the ones above !


pg.game = function ( id, handler ) {

  if ( typeof id !== 'string' ) {

    handler = id;
    id      = '*';
  }

  var game = new Game( id );

  // typeof handler => function
  games[ id ] = createGame( handler, game );

  return game;
};


// you are entering....
function createGame ( handler, game ) {

  return function ( params ) {

    handler( game, params );

    game.emit( 'enter', instance ); // || peers[id]// see params etc.
  };
}

/**
 *  Media
 *  =====
 *
 *	Handler just for mediastreaming (video & audio). Additional connection - which can be used
 *	besides the current handler/connection.
 */



// attachMediaStreams()


	// Connection.prototype.handleIncomingStreams = function(){

	// 	var conn = this.conn;

	// 	conn.onaddstream = function ( e ){

	// 		console.log('[added stream]');
	// 		console.log(e);
			// var video = document.createElement('video');
			// video.src = URL.createObjectURL( e.stream );
			// video.autoplay = true;

			// var box = document.createElement('div');
			// box.textContent = this.remoteID;
			// box.className = 'name';
			// box.appendChild(video);

			// document.body.appendChild( box );
			//


		// var remoteMediaStream=evt.stream;
		            // if(remoteMedia==null){
		            // remoteMedia=remoteMediaStream;
		            // }
		            // else
		            // {
		            //     remoteMedia.addTrack(remoteMediaStream.getVideoTracks()[0]); //add the video track to the existing stream
		            // }
		            // if(remoteVideo!=null)  {
		            // //    $(remoteVideo).remove();
		            //     //remoteVideo=null;
		            // }

		// }.bind(this);

		// conn.onremovestream = function ( e ) {

		// 	console.log('[removed stream]');

			// document.getElementById('vid2').src = null;
			// URL.revokeObjectURL( e.stream );
		// };


		// window.test = function(){

			// device access
			// var permissions = { audio: true, video: true };

			// navigator.getUserMedia( permissions, function ( stream ) {


			// 	var videoTracks = stream.getVideoTracks(),
			// 		audioTracks = stream.getAudioTracks();

			// 	// this.stream = stream;
			// 	console.log(conn);
			// 	conn.addStream( stream );

				// var video = document.createElement('video');

				// video.src = URL.createObjectURL(stream);
				// video.autoplay = true;

				// document.body.appendChild( video );

	// 		}.bind(this));

	// 	}.bind(this);
	// };






	// Connection.prototype.handleIncomingStreams = function(){

	// 	var conn = this.conn;

	// 	conn.onaddstream = function ( e ){

	// 		console.log('[added stream]');
	// 		console.log(e);
			// var video = document.createElement('video');
			// video.src = URL.createObjectURL( e.stream );
			// video.autoplay = true;

			// var box = document.createElement('div');
			// box.textContent = this.remoteID;
			// box.className = 'name';
			// box.appendChild(video);

			// document.body.appendChild( box );
			//


		// var remoteMediaStream=evt.stream;
		            // if(remoteMedia==null){
		            // remoteMedia=remoteMediaStream;
		            // }
		            // else
		            // {
		            //     remoteMedia.addTrack(remoteMediaStream.getVideoTracks()[0]); //add the video track to the existing stream
		            // }
		            // if(remoteVideo!=null)  {
		            // //    $(remoteVideo).remove();
		            //     //remoteVideo=null;
		            // }

		// }.bind(this);

		// conn.onremovestream = function ( e ) {

		// 	console.log('[removed stream]');

			// document.getElementById('vid2').src = null;
			// URL.revokeObjectURL( e.stream );
		// };


		// window.test = function(){

			// device access
			// var permissions = { audio: true, video: true };

			// navigator.getUserMedia( permissions, function ( stream ) {

				// var videoTracks = stream.getVideoTracks(),
					// audioTracks = stream.getAudioTracks();

				// conn.addStream( stream );


				// this.stream = stream;
				// var video = document.createElement('video');

				// video.src = URL.createObjectURL(stream);
				// video.autoplay = true;

				// document.body.appendChild( video );

	// 		}.bind(this));

	// 	}.bind(this);
	// };


/**
 *  Peer
 *  ====
 *
 *  A wrapper for a Peer/Node. Using singleton pattern.
 */


// Collection of all connected peers
pg.peers = {};

// shortcut to access the stored data
pg.data  = [];

// internal: mapping data-reference to ids
var dataMap = {};


var Peer = function ( data ) {

  this.init( data.id, data.account );
};


// used for: player.on .....
utils.inherits( Peer, Emitter );


Peer.prototype.init = function ( id, account ) {

  Emitter.call( this );

  this.id                     = id;

  this.account                = account;

  if ( !this.data ) this.data = {};

  dataMap[ this.id ]          = pg.data.push( this.data ) - 1;
};


// clears references + triggers callbacks on disconnect
Peer.prototype.remove = function(){

  var id = this.id;

  pg.data.splice( dataMap[id], 1 );

  instance.emit( 'disconnect', this );

  delete pg.peers[ id ];
  delete instance.connections[ id ];
}

//= require "_watch.js"
/**
 *  Player
 *  ======
 *
 *  Interface for the player - will extend the peer wrapper.
 *  // A wrapper for a Peer/Node. Using singleton pattern.
 */

// join
// message
// media


// connect will be used internaly ! // hide unrequired task !



// this: account, data, id
//
// != events, connections

// Public:
// - .join( room, params );
// - .message()


// allow declaring callbacks in advance

var callbackRefs = {};

pg.player = { on: function ( channel, callback, context ) {

  if ( !callbackRefs[ channel ] ) callbackRefs[ channel ] = [];

  callbackRefs[ channel ].push([ callback, context ]);
}};




var Player = function ( account, origin ) {

  'use strict';


  var id = utils.createUID();

  // ToDo: freeze - not allowing to delete the data property
  this.data = getReactor( Manager.update );

  this.connections = {};

  this.init( id, account );

  if ( Object.keys( callbackRefs ).length ) this._events = callbackRefs;


  console.log('\n\t\t:: ' + this.id + ' ::\n');


  var register = function(){

    socket.init( this.id, origin, function ( remoteID ) {

      if ( remoteID ) {

        this.checkNewConnections([ remoteID ]);

      } else {

        // this.stores.global = new DHT( pg.config.dht );
      }

    }.bind(this));

  }.bind(this);


  if ( socketQueue.ready ) {

    register();

  } else {

    socketQueue.add( register );
  }
};


utils.inherits( Player, Peer );


Player.prototype.checkNewConnections = function ( list, transport ) {

  var connections = this.connections,
      localID     = this.id,
      remoteID;

  for ( var i = 0, l = list.length; i < l; i++ ) {

    remoteID = list[i];

    if ( remoteID !== localID && !connections[ remoteID ] ) {

      this.connect( remoteID, true, transport );
    }
  }
};


// perhaps hide interfaces, include the check new connections into the 'instance.connect' ?
Player.prototype.connect = function ( remoteID, initiator, transport ) {

  if ( this.connections[remoteID] ) return; // as connection is force by the user

  // console.log( '[connect] to - "' + remoteID + '"' );

  var connection = new Connection( this.id, remoteID, initiator || false, transport );

  this.connections[ remoteID ] = connection;

  pg.peers[ remoteID ] = new Peer({ id: remoteID, connection: connection });
};


// check if last entry has the same channel - reload page/anchor
// change URL for router communication
Player.prototype.join = function ( channel, params ) {

  if ( channel.charAt(0) == '/' ) channel = channel.substr(1);

  var path = [ '!/', channel, utils.createQuery( params ) ].join('');


  if ( path === '!/' + SESSION.currentRoute || win.location.hash ) { // && ?

    return checkRoute();
  }

  win.location.hash = path;
};


// offer and creates a media stream
Player.prototype.media = function ( id, config, callback ) {


};


Player.prototype.send = function ( channel, msg ) {

  if ( !msg ) {

    msg = channel;
    channel = null;
  }

  if ( !channel ) channel = [ 'message' ];

  if ( !Array.isArray( channel ) ) channel = [ channel ];

  var connections = this.connections,
    keys = Object.keys( connections ),
    conn, i, l, n, k;

  for ( i = 0, l = keys.length; i < l; i++ ) {

    conn = connections[ keys[i] ];

    for ( n = 0, k = channel.length; n < k; n++ ) {

      conn.send( channel, { local: this.name, msg: msg });
    }
  }
};


/**
 *  Loop
 *  ====
 *
 *  Wrapping game loop - sync processing of messages.
 *
 *  Examples:
 *
 *    pg.loop(function ( delta ) {
 *
 *
 *    });
 */


pg.loop = (function(){


  var loop = function ( next ) {

    delta = 100;

    while ( delta >= LOOP_TIME ) {

      delta -= LOOP_TIME;

      // render()
    }


    // next( );
    requestAnimationFame( loop );
  };

  return loop;

})();


// requestAniation frame


// pause:

// on disconnect, offline
// on visibility hidden (trigger pause)




// sync time -? will be define in the inital connection , just for testing 0 or 1 || can be updated
// internally.....

// see property. get passed time since started, request.animatin frame

// function loop ( render ) {

//      delta time

//      while ( >= SYNC_DELAY ) {
//
//          delta -= SYNC_DELAY;
//
//          render();
//      }



//     render();
//     requestAnimationFame( loop );
// }


// loop(function(){

//     // .update()
//     // .draw()
// });




// as a channel will be called - creating one - coomunicate with others to join ?
// pg.routes( createChannel, createGame ); //




// visibility change etc. as well


// // pause... resume

// // We simply subscribe to the offline or online event and pass a function (or function reference)
// // invoke our handler when the offline event occurs
// window.addEventListener("offline", whoopsWeAreOffline);
// // and when the online event occurs....
// window.addEventListener("online", sweetBackOnLine);



// if (navigator.onLine) {
//     sweetWeAreKindaMaybeOnline();
// } else {
//     uhOhWeAreProbablyButNotDefinitelyOffline();
// }



	return pg;
});
