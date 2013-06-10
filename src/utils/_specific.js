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
