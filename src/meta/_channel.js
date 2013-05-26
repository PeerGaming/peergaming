/**
 *  Channel
 *  =======
 *
 *  Channel as a room for conversations etc.
 *
 *
 *  Example:
 *
 *    pg.channel('example', function ( channel ) {
 *
 *      console.log(channel);
 *    });
 *
 *  ## Events
 *
 *  - 'enter' : trigger as a user enter the room
 *  - 'leave' : trigger as a peer leaves the room
 *
 *
 *  - 'media' : trigger as a peer broadcasts a stream || room
 *  - 'message '?
 *
 */

var CHANNELS = {};


var Channel = function ( id ) {

  this.init( id );
};


utils.inherits( Channel, Emitter );


Channel.prototype.init = function ( id ) {

  this.id = id;

  Emitter.call( this );
};


Channel.prototype.config = function ( customConfig ) {

};


pg.channel = createRoom( Channel );



function createRoom ( type ) {

  return function ( id, handler ) {

    if ( typeof id !== 'string' ) { handler = id; id = '*'; }

  // ToDo: look for better handling than instance | typeof handler => function
    var room = new type( id ),

        list = ( room instanceof Game ) ? GAMES : CHANNELS;

    list[ id ] = room;

    handler( room );

    return room;
  };
}

