/**
 *  Event
 *  =====
 *
 *  Message handling using a Mediator (publish/subscribe).
 */

// user: player - peers
var eventMap = {};

var Emitter = (function(){

  'use strict';


  /**
   *  Constructor
   */

  var EventEmitter = function() {

    if ( this instanceof Peer ) {

      eventMap[ this.id ] = {};

    } else {

      this._events        = {};
    }

    return this;
  };


  /**
   * Register callbacks to topics.
   *
   * @param  {string}   topics  - topics to subscribe
   * @param  {function} callback  - function which should be executed on call
   * @param  {object}   context - specific context of the execution
   */

  EventEmitter.prototype.on = function ( topics, callback, context ) {

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
   *  [once description]
   *  @param  {[type]}   topics   [description]
   *  @param  {Function} callback [description]
   *  @param  {[type]}   context  [description]
   *  @return {[type]}            [description]
   */

  EventEmitter.prototype.once = function ( topics, callback, context ) {

    this.on( topics, function once() {

      this.off( topics, once );

      callback.apply( this, arguments );

    }.bind(this));

    return this;
  };


  /**
   * Send data to subscribed functions.
   *
   * @param  {string}   topic   - topic to send the data
   * @params  ......    arguments - arbitary data
   */

  EventEmitter.prototype.emit = function ( topic ) {

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
   * Unsubscribe callbacks from a topic.
   *
   * @param  {string}   topic   - topic of which listeners should be removed
   * @param  {function} callback  - specific callback which should be removed
   */

  EventEmitter.prototype.off = function ( topic, callback ) {

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


  return EventEmitter;

})();
