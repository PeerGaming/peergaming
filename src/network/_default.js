/**
 *  Default
 *  =======
 *
 *  Default Handler for common task (e.g. estbalish mesh network).
 *  Context will be the on of the connection ? or like before from the handler ?
 */

// custom handler collection

// var customHandlers = {};
// customHandlers[ label ] ||

var defaultHandlers = {


  init: {

    open: function() {

      // channel established + open
      delete this.info.pending;

      // share initial state
      this.send( 'init', {

        account : INSTANCE.account,
        time    : INSTANCE.time,
        data    : INSTANCE.data,
        list    : Object.keys( CONNECTIONS )
      });

      // TODO: 0.6.0 -> define values via secure access

      // send performance request here - set latency and share with other ?
        // latency : INSTANCE.latency,
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],
          data = msg.data;

      utils.extend( peer.data, data.data );

      peer.time    = data.time;
      peer.account = data.account;

      Manager.check( data.list, this  );
      Manager.setup( this.info.remote );
    },

    close: function ( msg ) {  /* console.log('[DatChannel closed]'); */ }
  },


  // just handler between - setting up for remote delegation
  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== INSTANCE.id ) {  // proxy -> info.transport

      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      // register call ? used for 'message' channel || always by 4 connections !

      // not avalaible anymore - left already
      if ( !CONNECTIONS[ msg.remote ] ) return console.log('[MISSING] ', msg.remote );

      return CONNECTIONS[ msg.remote ].send( 'register', msg.data, proxy );
    }

    // for register ? before own....
    if ( msg.action === 'update' ) return console.log('[update].... ', msg );

    Manager.set( msg, this );
  },


  // runs test - measures time for sending packages etc. ||
  // later + running tests through creating bytearrays !
  ping: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.pong ) return this.send( 'ping', { pong: true, index: data.index });

    Manager.setup( msg.local, data.index, data.pong );
  },


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


  update: function ( msg ) {

    msg = JSON.parse( msg );

    pg.peers[ msg.local ].data[ msg.data.key ] = msg.data.value;

    // TODO: 0.6.0 -> secure property access

    // console.log('[update] ', msg.data.key + ':' + msg.data.value );
  },


  sync: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.resync ) return resync( msg.local, data.key, data.value );

    sync( data.key, data.value, true ); // confirmed
  },


  message: function ( msg ) {

    INSTANCE.emit( 'message', msg );
  },


  // here again: action can be called for remote handling...
  custom: function ( msg ) {

    console.log('[channel doesn\'t exist yet - local delegation');

    msg = JSON.parse( msg );

    console.log(msg.action);
  }

};
