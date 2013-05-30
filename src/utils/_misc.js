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

utils.getHash = function getHash ( str ) {

  var hash = 0,

      i    = ( str && str.length ) ? str.length : 0;

  while ( i-- ) hash = hash * 31 + str.charCodeAt(i);

  return hash;
};


/**
 *  Converts a string into an arraybuffer
 *  (see: http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String )
 *
 *  @param {String} str   -
 */

utils.StringToBuffer = function StringToBuffer ( str ) {

  var buffer  = new ArrayBuffer( str.length * 2 ),
      view    = new Uint16Array( buffer );

  for ( var i = 0, l = str.length; i < l; i++ ) {

    view[i] = str.charCodeAt(i);
  }

  return buffer;
};


/**
 *  Converts a buffer into a string
 *
 *  @param {Array} buffer   -
 */

utils.BufferToString = function BufferToString ( buffer ) {

  return String.fromCharCode.apply( null, new Uint16Array( buffer ) ) ;
};


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
