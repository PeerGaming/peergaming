/**
 *  Socket
 *  ======
 *
 *  Transport layer used to communicate with the server.
 */


var socketQueue = new Queue();

var socket = (function(){

  // initial
  logout();

  // close for SSE
  win.addEventListener( 'unload'        , logout );
  win.addEventListener( 'beforeunload'  , logout );


  /**
   *  Request for EventSource / XHR-Polling
   *
   *  @param  {Object}   msg    -
   *  @param  {Function} next   -
   */

  function req ( msg, next ) {

    // TODO: pooling the request objects
    var xhr = new XMLHttpRequest();

    xhr.open( 'POST', config.socketConfig.server, true );

    if ( next ) {

      // ToDo: onprogress + check
      xhr.onload = function ( e ) {

        xhr.onload = null;
        next( e.currentTarget.response );
      };
    }

    xhr.setRequestHeader( 'Content-Type', 'text/plain; charset=UTF-8' );
    xhr.send( msg );
  }


  /**
   *  Removes ID/token from the server
   */

  function logout() {

    if ( checkProtocol('ws') || SERVERLESS ) {

      socketQueue.ready = true;
      return;
    }


    if ( SESSION.id ) {

      // XHR
      var msg = { action: 'remove', data: SESSION.id };

      send( msg, function(){

        // beforeunload callback
        if ( !socketQueue.ready ) {

          delete SESSION.id;

          socketQueue.exec();
        }
      });

    } else {

      socketQueue.exec();
    }
  }


  /**
   *  Set the session based ID and defines callbacks for server connection
   *
   *  @param {String}   id       -
   *  @param {String}   origin   -
   *  @param {Function} next     -
   */

  function init ( id, origin, next ) {

    SESSION.id = id;

    connectToServer( id, origin, function(){

      send({ action: 'lookup' }, function ( remoteID ) {  next( remoteID ); });
    });
  }


  var socket = null;

  /**
   *  Establish a WebSocket or EventSource connection
   *
   *  @param {String}   id       -
   *  @param {String}   origin   -
   *  @param {Function} next     -
   */

  function connectToServer ( id, origin, next ) {

    var Socket = checkProtocol('http') ? EventSource : WebSocket;

    socket = new Socket( config.socketConfig.server + '/?local=' + id + '&origin=' + origin );

    socket.addEventListener( 'error' , handleError );

    socket.addEventListener( 'open'  , function(){

      socket.addEventListener( 'message', handleMessage );
      socket.addEventListener( 'close'  , handleClose   );

      next();
    });

  }


  /**
   *  Delegate messages from the server
   *
   *  @param {Object} e   -
   */

  function handleMessage ( e ) {

    var msg = JSON.parse( e.data );

    if ( !msg || !msg.local ) { // partnerIDs

      return ( socketQueue.list.length ) ? socketQueue.exec( msg ) : Manager.check( msg );
    }

    Manager.set( msg );
  }

  /**
   *  Handle error messages/states
   *
   *  @param {Object} e   -
   */

  function handleError ( e ) {

    // XHR
    if ( e.eventPhase === EventSource.CLOSED ) return handleClose();

    try {

      e.currentTarget.close();

      logout();

    } catch ( err ) { console.log(err); }

    throw new Error( e.data );
  }


  /**
   *  Show message on closing
   */
  function handleClose(){

    console.log('[SOCKET] - CLOSE');
  }


  /**
   *  Sending messages and using callback depending on the transport
   *
   *  @param {Object}   msg    -
   *  @param {Function} next   -
   */

  function send ( msg, next )  {

    utils.extend( msg, { local: INSTANCE.id, origin: INFO.route });

    msg = JSON.stringify( msg );

    if ( checkProtocol('http') ) {

      req( msg, next );

    } else {  // WS

      if ( next ) socketQueue.add( next );

      if ( SERVERLESS ) return SERVERLESS( msg );

      socket.send( msg );
    }
  }


  /**
   *  Verify the used protocol by the server side component
   *
   *  @param {String} protocol   -
   */

  function checkProtocol ( protocol ) {

    return config.socketConfig.server.split(':')[0] === protocol;
  }


  return {

    init    : init,
    send    : send,
    handle  : handleMessage
  };

})();
