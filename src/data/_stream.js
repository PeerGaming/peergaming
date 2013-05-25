/**
 *  Stream
 *  ======
 *
 *  Interface for streaming activities.
 */


var Stream = (function(){

  'use strict';

  var Stream = function ( options ) {

    Emitter.call( this );

    if ( !options ) options = {};

    this.readable   = options.readable;
    this.writeable  = options.readable;

    this.ready      = true;
    // this.offset    = 0;            // current offset - used to merge chunks ?

    this.writeBuffer  = [];
    this.readBuffer   = [];
  };


  utils.inherits( Stream, Emitter );


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


  // ToDo:  check if others are empty - open ,
  //      else push on queue and wait till finish !
  // stream has to handle readystate etc.

  Stream.prototype.write = function ( msg ) {

    this.writeBuffer.push( msg );

    if ( this.ready ) {

      this.emit( 'write', this.writeBuffer.shift() );

    } else {

      // handle simoultanous accessing - using queue, messages etc.
    }

    return this.ready;
  };


  Stream.prototype.pipe = function ( trg ) {

    this.on( 'data', function ( chunk ) { trg.handle( chunk ); });

    return trg;
  };

  return Stream;

})();
