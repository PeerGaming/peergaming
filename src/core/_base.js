/**
 *	Base
 *	====
 *
 *	Basic wrapper definitions.
 */

var pg = function(){

};

pg.VERSION = '0.1.5';


var ready = false;

var instance;	// used for single reference !

pg.queue = [];


/**
 *	Extends properties of an Object.
 *
 *	@param  {[type]} target [description]
 *	@return {[type]}        [description]
 */

function extend ( target ) {

	var source, key;

	for ( var i = 1, length = arguments.length; i < length; i++ ) {

		source = arguments[i];

		for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
	}

	return target;
}
