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

  // this.match = function ( type ) {};  // TODO: 0.7.0 -> matchmaking
};


utils.inherits( Channel, Emitter );


Channel.prototype.init = function ( id ) {

  this.id = id;

  Emitter.call( this );
};


Channel.prototype.config = function ( customConfig ) {

  utils.extend( this.options, customConfig );
};


pg.channel = createRoom( Channel );



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

