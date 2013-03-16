/**
 *  Socket
 *  ======
 *
 *  Transport layer used to communicate with the server.
 *
 *  First using WebSocket or XHR - later replaced through the specific DataChannel reference.
 */



var socketQueue = new Queue();

var socket = (function(){

	'use strict';

	// SSE
	win.addEventListener('beforeunload', logout );
	win.addEventListener('DOMContentLoaded', logout );


	/**
	 *  [req description]
	 *
	 *  Request for EventSource / Polling
	 *  @param  {[type]}   msg  [description]
	 *  @param  {Function} next [description]
	 *  @return {[type]}        [description]
	 */

	function req ( msg, next ) {

		// ToDo: pooling the request objects
		var xhr = new XMLHttpRequest();

		xhr.open( 'POST', config.socketConfig.server, true );

		if ( next ) {

			xhr.onload = function ( e ) {

				xhr.onload = null;
				next( e.currentTarget.response );
			};
		}

		xhr.setRequestHeader( 'Content-Type', 'text/plain; charset=UTF-8' );
		xhr.send( msg );
	}


	/**
	 *  [logout description]
	 *
	 *  Remove ID from the server.
	 *  @param  {[type]} e [description]
	 *  @return {[type]}   [description]
	 */

	function logout() {

		// no manual logout required
		if ( config.socketConfig.server.split(':')[0] !== 'http' ) {	//

			socketQueue.ready = true;
			return;
		}

		if ( sessionStorage.id ) {

			// XHR
			var msg = { action: 'remove', data: sessionStorage.id };

			send( msg, function(){

				if ( !socketQueue.ready ) {	// beforeunload callback

					delete sessionStorage.id;

					socketQueue.exec();
				}
			});

		} else {

			socketQueue.exec();
		}
	}


	/**
	 *  [init description]
	 *
	 *  Register on the server.
	 *  @param  {[type]}   id   [description]
	 *  @param  {Function} next [description]
	 *  @return {[type]}        [description]
	 */

	function init ( id, next ) {

		sessionStorage.id = id;

		connectToServer( id, function(){

			var msg = {	action: 'lookup', data: id };

			send( msg, function ( remoteID ) {

				next( remoteID );
			});
		});
	}


	/**
	 *  [listenToServer description]
	 *
	 *  Attach Server
	 *  @param  {[type]}   id   [description]
	 *  @param  {Function} next [description]
	 *  @return {[type]}        [description]
	 */

	var socket;

	function connectToServer ( id, next ) {

		function handleOpen() { next();	}

		if ( config.socketConfig.server.split(':')[0] === 'http' ) {	// XHR

			socket = new EventSource( config.socketConfig.server + '/' + id );

		} else {		// WS

			socket = new WebSocket( config.socketConfig.server + '/' + id );
		}

		socket.addEventListener( 'open'		, handleOpen );
		socket.addEventListener( 'message'	, handleMessage );
		socket.addEventListener( 'error'	, handleError );
	}


	/**
	 *  [handleMessage description]
	 *
	 *  Interface for parsing messages.
	 *  @param  {[type]} e [description]
	 *  @return {[type]}   [description]
	 */

	function handleMessage ( e ) {

		var msg = JSON.parse( e.data );

		if ( !msg || !msg.local ) {	// receive partner via socket

			socketQueue.exec( msg );
			return;
		}

		if ( !instance.connections[ msg.local ] ) {

			instance.connect( msg.local );
		}

		// SDP & Candidates
		instance.connections[ msg.local ][ msg.action ]( msg.data );
	}


	/**
	 *  [handleError description]
	 *
	 *  Handling errors.
	 *  @param  {[type]} e [description]
	 *  @return {[type]}   [description]
	 */

	function handleError ( e ) {


		// XHR
		if ( e.eventPhase === EventSource.CLOSED ) {

			console.log('[close]');

		} else {

			throw new Error( e.data );
		}

		var socket = e.currentTarget;

		socket.close();

		logout();
	}

	// function checkProtocol(){

	//	var link = document.createElement('a');
	//	link.href = config.socketConfig.server;

	//	return link.protocol;
	// }


	/**
	 *  [send description]
	 *
	 *  Sending messages throug the appropriate transport socket.
	 *
	 *  @param  {[type]} msg [description]
	 *  @return {[type]}     [description]
	 */

	function send ( msg, next )  {

		msg = JSON.stringify( msg );

		if ( config.socketConfig.server.split(':')[0] === 'http' ) { // XHR

			req( msg, next );

		} else {	// WS

			socketQueue.add( next );

			socket.send( msg );
		}
	}


	return {

		init	: init,
		send	: send,
		handle	: handleMessage
	};

})();

