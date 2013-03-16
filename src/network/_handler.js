/**
 *  Handler
 *  =======
 *
 *  Delegating through error - close, messaging events. // // handler for a new channel
 */


var Handler = (function(){

	var Handler = function ( remoteID, options ) {

		this.remoteID = remoteID;

		this.connection = instance.connections[this.remoteID];

		if ( options ) {

			if ( !options.message ) {

				options = { message: options };
			}

			var keys = Object.keys( options );

			for ( var i = 0, l = keys.length; i < l; i++ ){

				this[ '_' + keys[i] ] = options[ keys[i] ];
			}
		}
	};

	Handler.prototype.open = function ( e ) {

		var channel	= e.currentTarget;

		this.name = channel.label;

		// console.log('[open] - '  +this.name);

		//channel.binaryType = 'arraybuffer'; // 'blob'

		channel.addEventListener( 'message',	this.message.bind(this) );
		channel.addEventListener( 'close',		this.close.bind(this)	);
		channel.addEventListener( 'error',		this.error.bind(this)	);

		this.connection.channels[this.name] = channel;

		if ( this._open ) this._open.call( this.connection, e );
	};

	Handler.prototype.message = function ( e ) {

		// console.log('[message]');
		// console.log(e);

		if ( this._message ) this._message.call( this.connection, e );
	};

	Handler.prototype.error = function ( e ) {

		console.log('[channel - error]');
		// console.log(e);

		if ( this._error ) this._error.call( this.connection, e );
	};

	Handler.prototype.close = function(){

		console.log('[channel - closed]');
		// console.log(e);

		if ( this._close ) this._close.call( this.connection, e );
	};


	return Handler;

})();
