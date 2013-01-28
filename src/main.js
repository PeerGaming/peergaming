/*jshint devel:true */

(function ( name, context, definition ) {

	if ( typeof module !== 'undefined' ) {

		module.exports = definition( context );

	} else if ( typeof define !== 'undefined' ) {

		define( name, function(){ return definition( context ); });

	} else {

		context[name] = definition( context );
	}

})('pg', this, function ( context, undefined ) {

	'use strict';

	var pg = {};


	function extend ( target ) {

		var source, key;

		for ( var i = 1, length = arguments.length; i < length; i++ ) {

			source = arguments[i];

			for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
		}

		return target;
	}



	//= require "utils"
	//= require "data"
	//= require "network"
	//= require "game"


	return pg;
});
