/**
 *  Emitter
 *  =======
 *
 *  A Mediator for handling messages via events.
 */

// user: player - peers
var eventMap = {};


/**
 *  Constructor to setup the container for the topics
 *
 *  @return {Object}
 */

var Emitter = function() {

  if ( this instanceof Peer ) {

    eventMap[ this.id ] = {};

  } else {

    this._events        = {};
  }

  return this;
};


/**
 *  Register/Subscribe callbacks to topics
 *
 *  @param  {String}   topics     -
 *  @param  {Function} callback   -
 *  @param  {Object}   context    -
 *  @return {Object}
 */

Emitter.prototype.on = function ( topics, callback, context ) {

  if ( typeof callback !== 'function' ) return;

  topics = topics.split(' ');

  var events  = ( this instanceof Peer ) ? eventMap[ this.id ] : this._events,
      length  = topics.length,
      topic;

  while ( length-- ) {

    topic = topics[ length ];

    if ( !events[ topic ] ) events[ topic ] = [];

    events[ topic ].push([ callback, context ]);
  }

  return this;
};


/**
 *  Register for one time usage
 *
 *  @param  {String}   topics     -
 *  @param  {Function} callback   -
 *  @param  {Object}   context    -
 *  @return {Object}
 */

Emitter.prototype.once = function ( topics, callback, context ) {

  this.on( topics, function once() {

    this.off( topics, once );

    callback.apply( this, arguments );

  }.bind(this));

  return this;
};



/**
 *  Triggers listeners and sends data to subscribes functions
 *
 *  @param  {String} topic   -
 *  @return {Object}
 */

Emitter.prototype.emit = function ( topic ) {

  var events    = ( this instanceof Peer ) ? eventMap[ this.id ] : this._events,

      listeners = events[ topic ];

  if ( listeners ) {

    var args    = Array.prototype.slice.call( arguments, 1 ),

        length  = listeners.length;

    while ( length-- ) {

      listeners[length][0].apply( listeners[length][1], args || [] );
    }
  }

  return this;
};


/**
 *  Unsubscribe callbacks from a topic
 *
 *  @param  {String}   topic      - topic of which listeners should be removed
 *  @param  {Function} callback   - specific callback which should be removed
 *  @return {Object}
 */

Emitter.prototype.off = function ( topic, callback ) {

  var events    = ( this instanceof Peer ) ? eventMap[ this.id ] : this._events,
      listeners = events[ topic ];

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

  return this;
};
