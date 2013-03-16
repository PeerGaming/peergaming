/**
 *	Event
 *	=====
 *
 *	Message handling using a Mediator (publish/subscribe).
 */

utils.extend( utils, function(){

	'use strict';

	// cache
	var channels = {};


	/**
	 * Register callbacks to topics.
	 *
	 * @param  {String}   topics	- topics to subscribe
	 * @param  {Function} callback	- function which should be executed on call
	 * @param  {Object}   context	- specific context of the execution
	 */
	function subscribe ( topics, callback, context ) {

		topics = topics.split(' ');

		var length = topics.length,	topic;

		while ( length-- ) {

			topic = topics[ length ];

			if ( !channels[ topic ] ) channels[ topic ] = [];

			channels[ topic ].push([ callback, context ]);
		}
	}


	/**
	 * Send data to subscribed functions.
	 *
	 * @param  {String}		topic		-	topic to send the data
	 * @params	......		arguments	-	arbitary data
	 */
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


	/**
	 * Unsubscribe callbacks from a topic.
	 *
	 * @param  {String}		topic		- topic of which listeners should be removed
	 * @param  {Function}	callback	- specific callback which should be removed
	 */
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

