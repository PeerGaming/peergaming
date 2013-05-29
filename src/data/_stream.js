/**
 *  Stream
 *  ======
 *
 *  Interface for handling streaming behavior.
 */


/**
 *  Constructor to define configurations and setup buffer
 *
 *  @param  {Object} options   -
 */

var Stream = function ( options ) {

  if ( !options ) options = {};

  this.readable     = options.readable;
  this.writeable    = options.readable;

  this.ready        = true;

  this.writeBuffer  = [];
  this.readBuffer   = [];

  Emitter.call( this );
};


/**
 *  Stream <- Emitter
 */

utils.inherits( Stream, Emitter );


/**
 *  Delegates the action for the data (chunk or message)
 *
 *  @param  {Object} e   -
 */

Stream.prototype.handle = function ( e ) {

  var msg     = e.data,

      data    = JSON.parse( msg ),

      buffer  = this.readBuffer;


  if ( data.part !== void 0 ) {

    buffer.push( data.data );

    this.emit( 'data', data, buffer.length );

    if ( data.part > 0 ) return;

    msg = buffer.join('');

    buffer.length = 0;
  }

  this.emit( 'end', msg );
};


/**
 *  Send input through the stream
 *
 *  @param  {Object}  msg   -
 *  @return {Boolean}
 */

Stream.prototype.write = function ( msg ) {

  this.writeBuffer.push( msg );

  if ( this.ready ) {

    this.emit( 'write', this.writeBuffer.shift() );

  } else {

    // TODO: handle blocking simultaneous usage
  }

  return this.ready;
};


/**
 *  Uses the output of one stream as the input for another
 *
 *  @param  {Object} trg   -
 *  @return {Object}
 */

Stream.prototype.pipe = function ( trg ) {

  this.on( 'data', function ( chunk ) { trg.handle( chunk ); });

  return trg;
};
