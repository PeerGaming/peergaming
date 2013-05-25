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
 */


var channels = {};


var Channel = function ( id ) {

  Emitter.call( this );

  this.id = id;
};


utils.inherits( Channel, Emitter );



pg.channel = function ( id, handler ) {

  if ( typeof id !== 'string' ) {

    handler = id;
    id      = '*';
  }

  var channel = new Channel( id );

  // typeof handler => function
  channels[ id ] = createChannel( handler, channel );

  return channel;
};



function createChannel ( handler, channel ) {

  return function ( params ) {

    handler( channel, params );

    // you are entering....
    channel.emit( 'enter', INSTANCE );  // otherwise: peers[id]
  };
}

