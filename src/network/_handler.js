/**
 *  Handler
 *  =======
 *
 *  Delegating through error - close, messaging events. // // handler for a new channel
 */


var Handler = (function(){

// if ( options ) customHandlers[ label ] = options;

	var Handler = function ( channel, remote ) {	// remote not required, as already assigned

		var label		= channel.label;

		this.info		= {

			label	: label,
			remote	: remote
		};


		this.channel	= channel;

		this.stream		= new Stream({ readable: true, writeable: true });


		this.actions	= defaultHandlers[ label ] || defaultHandlers.custom;

		if ( typeof this.actions === 'function' ) this.actions = { end: this.actions };

		channel.addEventListener( 'open', this.init.bind(this) );
	};


	Handler.prototype.init = function ( e ) {

		// console.log('[open] - '  + this.label );

		var channel		= this.channel,

			actions		= this.actions,

			stream		= this.stream,

			connection	= instance.connections[ this.info.remote ],

			events = [ 'open', 'data', 'end', 'close', 'error' ];


		for ( var i = 0, l = events.length; i < l; i++ ) {

			stream.on( events[i], actions[ events[i] ], connection );
		}

		stream.on( 'write', function send ( msg ) { channel.send( msg ); });


		channel.onmessage	= stream.handle.bind( stream );

		channel.onclose		= function() { stream.emit( 'close' );	};

		channel.onerror		= function ( err ) { stream.emit( 'error', err ); };

		stream.emit( 'open', e );
	};


	// currently still required to encode arraybuffer to to strings...
	// // Using Strings instead an arraybuffer....
	Handler.prototype.send = function ( msg ) {

		var data = JSON.stringify( msg ),

			buffer = data; //utils.StringToBuffer( data );


		if ( buffer.length > config.channelConfig.MAX_BYTES ) {
		// if ( buffer.byteLength > config.channelConfig.MAX_BYTES ) {

			buffer = createChunks( buffer );	// msg.remote...

		} else {

			buffer = [ buffer ];
		}

		for ( var i = 0, l = buffer.length; i < l; i++ ) {

			this.stream.write( buffer[i] );
		}
	};


	function createChunks ( buffer ) {

		var	maxBytes	= config.channelConfig.MAX_BYTES,
			chunkSize	= config.channelConfig.CHUNK_SIZE,
			size		= buffer.length, //byteLength,
			chunks		= [],

			start		= 0,
			end			= chunkSize;

		while ( start < size ) {

			chunks.push( buffer.slice( start, end ) );

			start = end;
			end = start + chunkSize;
		}

		var l = chunks.length,
			i = 0;				// increment

		while ( l-- ) {

			chunks[l] = JSON.stringify({ part: i++, data: chunks[l] });
		}

		return chunks;
	}


	return Handler;

})();
