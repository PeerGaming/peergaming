/**
 *  Channel
 *  =======
 *
 *  An intermediate room for conversations.
 */


var CHANNELS = {};  // record of channels


/**
 *  Creates a Channel
 *
 *  @return {Object}
 */

var setChannel = createRoom( Channel );


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

inherits( Channel, Emitter );


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

  extend( this.options, customConfig );
};

