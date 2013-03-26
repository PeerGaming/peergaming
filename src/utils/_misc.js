/**
 *  Misc
 *  ====
 *
 *  Collection of simple helpers.
 */


var utils = {};


// improved typeof
// utils.check = function ( obj ) {

//	return Object.prototype.toString.call( obj ).slice( 8, -1 );
// };


/**
 *	Extends properties of an Object.
 *
 *	@param  {[type]} target [description]
 *	@return {[type]}        [description]
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

			value			: child,
			enumerable		: false,
			writable		: true,
			configurable	: true
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

	var buffer	= new ArrayBuffer( str.length * 2 ), // 2 bytes per char
		view	= new Uint16Array( buffer );

	for ( var i = 0, l = str.length; i < l; i++ ) {

		view[i] = str.charCodeAt(i);
	}

	return buffer;
};


utils.BufferToString = function BufferToString ( buffer ) {

	return String.fromCharCode.apply( null, new Uint16Array( buffer ) ) ;
};
