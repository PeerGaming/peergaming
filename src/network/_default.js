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

      delete this.info.pending; // channel established + open

      this.send( 'init', { name: INSTANCE.account.name, list: Object.keys( CONNECTIONS ) });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],

          data = msg.data;

      utils.extend( peer, { account: { name: data.name } });


      INSTANCE.emit( 'connection', peer );
      ROOM    .emit( 'enter'     , peer );


      Manager.check( data.list, this );

      Manager.test( this.info.remote );
    },

    close: function ( msg ) {  /* console.log('[DatChannel closed]'); */ }
  },


  // just handler between - setting up for remote delegation
  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== INSTANCE.id ) {  // proxy -> info.transport

      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      return CONNECTIONS[ msg.remote ].send( 'register', msg.data, proxy );
    }

    Manager.set( msg, this );
  },


  // runs test - measures time for sending packages etc. ||
  // later + running tests through creating bytearrays !
  ping: function ( msg ) {

    msg = JSON.parse( msg );

    var data = msg.data;

    if ( !data.pong ) {

      // benchmark - do performance tests here, to check the hardware, optional: send via pong
      var time = win.performance.now();

      return setImmediate(function(){

        this.send( 'ping', { index: data.index, pong: win.performance.now() - time });

      }.bind(this));
    }

    Manager.test( msg.local, data.index, data.pong );
  },


  update: function ( msg ) {

    msg = JSON.parse( msg );

    // just a reference to the // TODO: freeze !, shouldnt be able to change directly... internal...
    pg.peers[ msg.local ].data[ msg.data.key ] = msg.data.value;

    // console.log('[update] ', msg.data.key + ':' + msg.data.value );
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
