/**
 *	Event
 *	=====
 *
 *	Message handling using a Mediator (publish/subscribe).
 */

var Emitter = (function(){

	'use strict';


	/**
	 *  Constructor
	 */
	var EventEmitter = function(){

		this._events = {};

		return this;
	};


	/**
	 * Register callbacks to topics.
	 *
	 * @param  {String}   topics	- topics to subscribe
	 * @param  {Function} callback	- function which should be executed on call
	 * @param  {Object}   context	- specific context of the execution
	 */

	EventEmitter.prototype.on = function ( topics, callback, context ) {

		if ( typeof callback !== 'function' ) return;

		topics = topics.split(' ');

		var events	= this._events,
			length	= topics.length,
			topic;

		while ( length-- ) {

			topic = topics[ length ];

			if ( !events[ topic ] ) events[ topic ] = [];

			events[ topic ].push([ callback, context ]);
		}

		return this;
	};



	EventEmitter.prototype.once = function ( topics, callback, context ) {

		this.on( topics, function once() {

			this.off( type, once );

			callback.apply( this, arguments );

		}.bind(this));
	};


	/**
	 * Send data to subscribed functions.
	 *
	 * @param  {String}		topic		-	topic to send the data
	 * @params	......		arguments	-	arbitary data
	 */

	EventEmitter.prototype.emit = function ( topic ) {

		var events		= this._events,
			listeners	= events[ topic ];

		if ( listeners ) {

			var args = Array.prototype.slice.call( arguments, 1 ),

				length = listeners.length;

			while ( length-- ) {

				listeners[length][0].apply( listeners[length][1], args || [] );
			}
		}
	};


	/**
	 * Unsubscribe callbacks from a topic.
	 *
	 * @param  {String}		topic		- topic of which listeners should be removed
	 * @param  {Function}	callback	- specific callback which should be removed
	 */

	EventEmitter.prototype.off = function ( topic, callback ) {

		var events		= this._events,
			listeners	= events[ topic ];

		if ( !listeners ) return;

		if ( !callback ) {

			events[ topic ].length = 0;

		} else {

			var length = listeners.length;

			while ( length-- ) {

				if ( listeners[ length ] === callback ) {

					listeners.splice( length, 1 ); break;
				}
			}
		}

	};

	return EventEmitter;

})();
