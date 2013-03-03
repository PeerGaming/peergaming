/**
 *	Base:
 *
 *	Basic definitions
 */

var pg = function(){

};

pg.VERSION = '0.1.1';


function extend ( target ) {

	var source, key;

	for ( var i = 1, length = arguments.length; i < length; i++ ) {

		source = arguments[i];

		for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
	}

	return target;
}
