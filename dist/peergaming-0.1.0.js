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



	/* Message Handling using PubSub/Mediator */
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


/* flow control via promises */
extend( pg, function(){

	'use strict';

	var promise = {};

	return {


	};

}());


	/* data structure - linkedList */
extend( pg, function(){

	'use strict';

	var linkedListe = {};

	return {


	};


}());

/* data structure - hashtable */
extend( pg, function(){

	'use strict';

	var hashtable = {};


	return {


	};

}());


	/* request connection */
extend( pg, function(){

	'use strict';

	return {


	};

}());

/* connect with another peer */
extend( pg, function(){

	'use strict';

	var connect = {};

	return {



	};

}());


	/* game loop */
extend( pg, function(){

	'use strict';

	var loop = {};


	return {


	};


}());

/* Handling different steps */
extend( pg, function(){

	'use strict';

	var state = {};

	return {


	};


}());




	return pg;
});
