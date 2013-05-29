/**
 *  Channel
 *  =======
 *
 *  An intermediate room for conversations.
 */


/**
 *  Public interface for setting up a channel
 */

pg.channel = createRoom( Channel );


var CHANNELS = {};  // record of channels


/**
 *  Constructor to call init
 *
 *  @param {String} id   -
 */

function Channel ( id ) {

  this.init( id );

  this.match = function ( type ) {

    // TODO: 0.7.0 -> matchmaking
  };
}


/**
 *  Channel <- Emitter
 */

utils.inherits( Channel, Emitter );


/**
 *  Assign id and invokes Emitter
 *
 *  @param {String} id   -
 */

Channel.prototype.init = function ( id ) {

  this.id = id;

  Emitter.call( this );
};


/**
 *  Allows to setup custom options for this channel/game
 *
 *  @param {Object} customConfig   -
 */

Channel.prototype.config = function ( customConfig ) {

  utils.extend( this.options, customConfig );
};


/**
 *  Creates a new room (channel or game) and registers handler
 *
 *  @param  {Function} type   -
 *  @return {Function}
 */

function createRoom ( type ) {

  return function ( id, handler ) {

    if ( typeof id !== 'string' ) { handler = id; id = '*'; }

    var room = new type( id ),

        list = ( room instanceof Game ) ? GAMES : CHANNELS;

    list[ id ] = room;

    handler( room );

    return room;
  };
}
