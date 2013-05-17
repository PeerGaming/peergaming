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

  // initial
  logout();

  // close for SSE
  win.addEventListener( 'unload'        , logout );
  win.addEventListener( 'beforeunload'  , logout );


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
   *  [logout description]
   *
   *  Remove ID from the server.
   *  @param  {[type]} e [description]
   *  @return {[type]}   [description]
   */

  function logout() {

    // WS
    if ( checkProtocol('ws') ) {

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
   *  [init description]
   *
   *  Register on the server.
   *  @param  {[type]}   id   [description]
   *  @param  {Function} next [description]
   *  @return {[type]}        [description]
   */

  function init ( id, origin, next ) {

    SESSION.id = id;

    connectToServer( id, origin, function(){

      send({ action: 'lookup' }, function ( remoteID ) {  next( remoteID ); });
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

  function connectToServer ( id, origin, next ) {

    var Socket = checkProtocol('http') ? EventSource : WebSocket;

    socket = new Socket( config.socketConfig.server + '/?local=' + id + '&origin=' + origin );

    socket.addEventListener( 'open', function(){

      socket.addEventListener( 'message', handleMessage );
      socket.addEventListener( 'error'  , handleError   );
      socket.addEventListener( 'close'  , handleClose   );

      next();
    });
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

    // receive partner via socket & call register
    if ( !msg || !msg.local ) return socketQueue.exec( msg );

    // create new reference
    if ( !instance.connections[ msg.local ] ) instance.connect( msg.local );

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

      console.log('[socket - close]');

    } else {

      throw new Error( e.data );
    }

    // socket
    e.currentTarget.close();

    logout();
  }


  /**
   *
   */

  function handleClose(){

    console.log('[closed]');
  }



  /**
   *  [send description]
   *
   *  Sending messages throug the appropriate transport socket.
   *
   *  @param  {[type]} msg [description]
   *  @return {[type]}     [description]
   */

  function send ( msg, next )  {

    // just for server
    utils.extend( msg, { local: instance.id, origin: SESSION.currentRoute });

    msg = JSON.stringify( msg );

    if ( checkProtocol('http') ) { // XHR

      req( msg, next );

    } else {  // WS

      socketQueue.add( next );

      socket.send( msg );
    }
  }


  // required to check everytime/not just on inital start - as the configurations can be customized
  function checkProtocol ( protocol ) {

    return config.socketConfig.server.split(':')[0] === protocol;
  }


  return {

    init    : init,
    send    : send,
    handle  : handleMessage
  };

})();

