/**
 *  Transport
 *  =========
 *
 *  Communication layer used to communicate with the server.
 *
 *  First using WebSocket or XHR - later replaced through the specific DataChannel reference.
 */

var transport = (function(){

	'use strict';

	// server just checks if the response is still open ! || would then depend more likely on the server....

	win.addEventListener('beforeunload', logout );
	win.addEventListener('DOMContentLoaded', logout );

	// SSE

	function req ( msg, next ) {

		var xhr = new XMLHttpRequest();	// try pool for caching !

		xhr.open( 'POST', pg.config.server, true );

		if ( next ) {

			xhr.onload = function ( e ) {

				xhr.onload = null;
				next( e.currentTarget.response );
			};
		}

		xhr.setRequestHeader( 'Content-Type', 'text/plain; charset=UTF-8' );
		xhr.send( JSON.stringify(msg) );
	}











	function init ( id, next ) {

		var msg = {	action: 'register', data: id };

		sessionStorage.id = id;

		// XHR
		req( msg, function ( remoteID ) {

			listenToServer( id, function(){

				next( remoteID );
			});
		});
	}




	// remove entry from the server - end
	function logout ( e ) {

		if ( sessionStorage.id ) {

			// XHR
			var msg = { action: 'remove', data: sessionStorage.id };

			req( msg, function(){

				if ( !ready ) {	// beforeunload callback

					delete sessionStorage.id;

					ready = true;

					if ( pg.queue.length ) {

						for ( var i = 0, l = pg.queue.length; i < l; i++ ) {
							pg.queue[i]();
						}
					}
				}
			});

		} else {

			// execute queue !
			ready = true;

			if ( pg.queue.length ) {

				for ( var i = 0, l = pg.queue.length; i < l; i++ ) {
					pg.queue[i]();
				}
			}
		}
	}



	function listenToServer ( id, next ) {





		// XHR

		// ## ToDo
		//
		//
		//
		// -	Ajax based Stream Polling:
		//		http://www.codekites.com/ajax-based-streaming-without-polling/
		//
		// -	still receiving error as it's closed...

		var source;

		try {

			source = new EventSource( pg.config.server + '/' + id );

			source.addEventListener('open', function ( e ) {

				// console.log('open');
				next();	// ensure open stream
			});

			source.addEventListener('message', handleMessage );
			source.addEventListener('error', handleError );

		} catch ( e ) {

			console.log(e);
		}
	}




	// interface for parsing messages
	function handleMessage ( e ) {

		var msg = JSON.parse( e.data );

		if ( instance.connections[ msg.local ] ) {

			instance.connections[ msg.local ][ msg.action ]( msg.data );

		} else { // input -> offer / candidate

			instance.connect( msg.local, msg.data );
		}
	}




	function handleError ( e ) {

		// XHR
		if ( e.eventPhase === EventSource.CLOSED ) {

			console.log('[close]');

		} else {

			throw new Error( e.data );
		}

		var source = e.currentTarget;

		source.close();
	}


	function send ( msg )  {

		// first - as no other network
		req( msg );
	}



	return {

		init: init,
		send: send
	};


})();

