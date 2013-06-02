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
