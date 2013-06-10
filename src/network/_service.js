/**
 *  Service
 *  =======
 *
 *  Define default Handler for common tasks - e.g. establish a mesh network.
 */


var customHandlers = {};  // collection of custom handler


var defaultHandlers = {


  /**
   *  Basic information exchange on creation
   */

  init: {

    open: function() {

      // channel established + open
      delete this.info.pending;

      // share initial state
      this.send( 'init', {

        account : PLAYER.account,
        time    : PLAYER.time,
        data    : PLAYER.data,                // TODO: 0.6.0 -> define values for secure access
        list    : getKeys( CONNECTIONS )
      });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = PEERS[ this.info.remote ],
          data = msg.data;

      extend( peer.data, data.data );

      peer.time    = data.time;
      peer.account = data.account;

      MANAGER.check( data.list, this  );
      MANAGER.setup( this.info.remote );
    },

    /* previous unreliable - see gatheringstatechange */
    close: function ( msg ) { MANAGER.disconnect( this.info.remote ); }
  },


  /**
   *  Remote delegation for register another peer
   *
   *  @param {Object} msg   -
   */

  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== PLAYER.id ) {  // proxy -> info.transport

      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      //console.log('[ERORR] - Service: Missing Connection | ', msg.remote );
      if ( !CONNECTIONS[ msg.remote ] ) return;

      return CONNECTIONS[ msg.remote ].send( 'register', msg.data, proxy );
    }

    MANAGER.set( msg, this );
  },


  /**
   *  Run latency check by sending ping/pong signals
   *
   *  @param {Object} msg   -
   */

  ping: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.pong ) return this.send( 'ping', { pong: true, index: data.index });

    MANAGER.setup( msg.local, data.index, data.pong );
  },


  /**
   *  Permit the start of a game via remote request
   *
   *  @param  {[type]} msg [description]
   */

  start: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data || {};

    // late-join
    if ( data.request ) return forward( msg.local );

    // next in chain
    ensure();

    function ensure(){

      if ( !ROOM._start ) return setTimeout( ensure, DELAY );

      ROOM._start();
    }
  },


  /**
   *  Sets the keys and values of a peers remote model
   *
   *  @param {Object} msg   -
   */

  update: function ( msg ) {

    msg = JSON.parse( msg );

    PEERS[ msg.local ].data[ msg.data.key ] = msg.data.value;

    // TODO: 0.6.0 -> define values for secure access

    // console.log('[update] ', msg.data.key + ':' + msg.data.value );
  },


  /**
   *  Delegates synchronize requests of the shared object
   *
   *  @param {Object} msg   -
   */

  sync: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.resync ) return resync( msg.local, data.key, data.value );

    sync( data.key, data.value, true );
  },


  /**
   *  Invokes remote messages by call it them on your player
   *
   *  @param {Object} msg   -
   */

  message: function ( msg ) {

    PLAYER.emit( 'message', msg );
  },


  /**
   *  Using a shared channel to delegate remote calls
   *
   *  @param {Object} msg   -
   */

  custom: function ( msg ) {

    // console.log('[CUSTOM]');

    msg = JSON.parse( msg );

    console.log(msg.action);
  }

};
