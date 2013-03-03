/**
 *	peergaming.js - v0.1.1 | 2013-03-03
 *	http://peergaming.net
 *	Copyright (c) 2013, Stefan Dühring
 *	MIT License
 */

(function ( name, context, definition ) {

	if ( typeof module !== 'undefined' ) {

		module.exports = definition( context );

	} else if ( typeof define !== 'undefined' ) {

		define( name, function(){ return definition( context ); });

	} else {

		context[name] = definition( context );
	}

})('pg', this, function ( context, undefined ) {

/**
 *	Adapter:
 *
 *	Normalize different browser behavior
 */

if ( !window.URL ) {

	window.URL = window.webkitURL || window.msURL || window.oURL;
}

if ( !window.BlobBuilder ) {

	window.BlobBuilder =	window.BlobBuilder || window.WebKitBlobBuilder ||
							window.MozBlobBuilder || window.MSBlobBuilder ||
							window.OBlobBuilder;
}

if ( !window.indexedDB ) {

	if ( window.mozIndexedDB ) {

		window.indexedDB = window.mozIndexedDB;

	} else if ( window.webkitIndexedDB ) {

		window.indexedDB =  window.webkitIndexedDB;

		IDBCursor = webkitIDBCursor;
		IDBDatabaseException = webkitIDBDatabaseException;
		IDBRequest = webkitIDBRequest;
		IDBKeyRange = webkitIDBKeyRange;
		IDBTransaction = webkitIDBTransaction;

	} else {

		throw new Error('IndexedDB is currently not supported by your browser.');
	}
}

if ( !window.indexedDB.deleteDatabase ) {

	throw new Error('IndexedDB is currently not supported by your browser.');
}

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


/**
 *	Event:
 *
 *	Message handling using a Mediator (publish/subscribe).
 */

extend( pg, function(){

	'use strict';

	// cache
	var channels = {};


	function subscribe ( topics, callback, context ) {

		topics = topics.split(' ');

		var length = topics.length,	topic;

		while ( length-- ) {

			topic = topics[ length ];

			if ( !channels[ topic ] ) channels[ topic ] = [];

			channels[ topic ].push([ callback, context ]);
		}
	}


	function publish ( topic ) {

		var listeners = channels[ topic ];

		if ( listeners ) {

			var args = Array.prototype.slice.call( arguments, 1 ),

				length = listeners.length;

			while ( length-- ) {

				listeners[length][0].apply( listeners[length][1], args || [] );
			}
		}
	}


	function unsubscribe ( topic, callback ) {

		if ( !callback ) {

			channels[ topic ].length = 0;

		} else {

			var listeners = channels[ topic ],

				length = listeners ? listeners.length : 0;

			while ( length-- ) {

				if ( listeners[ length ] === callback ) {

					listeners.splice( length, 1 ); break;
				}
			}
		}
	}


	return {

		on	: subscribe,
		emit: publish,
		off	: unsubscribe
	};

}());


/**
 *	Promise:
 *
 *	Async flow control handling.
 */

extend( pg, function(){

	'use strict';

	var promise = {};

	return {


	};

}());

/**
 *	Statemachine:
 *
 *	Handling different steps
 */

extend( pg, function(){

	'use strict';

	var statemachine = {};

	return {


	};

}());


/**
 *	LinkedList:
 *
 *	A data structure
 */

var LinkedList = (function(){

	'use strict';

	var linkedList = function(){

	};

	return {


	};

}());

/**
 *	Hashtable:
 *
 *	A data structure
 */

var Hashtable = (function(){

	'use strict';

	var hashtable = function(){

	};

	return {


	};

}());


/**
 *	Request:
 *
 *	Requesting a connection with another Peer
 */

extend( pg, function(){

	'use strict';

	return {


	};

}());

/**
 *	Connect:
 *
 *	Connection with another Peer
 */

extend( pg, function(){

	'use strict';

	var connect = {};

	return {


	};

}());


/**
 *	Loop:
 *
 *	The main game loop (engine), handling processing/rendering
 *	jshint devel:true
 */

extend( pg, function(){

	'use strict';

	var loop = {};

	return {


	};

}());

/**
 *	Stats:
 *
 *	Tracking stats, providing them to an external interface
 */

extend( pg, function(){

	'use strict';

	var promise = {};

	return {


	};

}());



	return pg;
});
