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

	var pg = function(){};
/* event handling using channels */

/* flow control via promises */

/* data structure - hashtable */
/* data structure - linkedList */

/* peerconnection */

/* game elements */


	return pg;
});
