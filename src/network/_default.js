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

      // channel established && open
      delete this.info.pending;

      this.send( 'init', { name: INSTANCE.account.name, list: Object.keys( CONNECTIONS ) });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],

          data = msg.data;

      utils.extend( peer, { account: { name: data.name } });

      INSTANCE.emit( 'connection', peer );

      // providing transport - register delegation
      Manager.check( data.list, this );
    },

    close: function ( msg ) {

      console.log('[closed]');

      console.log(msg);
    }

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


  // here again: action can be called for remote handling...
  custom: function ( msg ) {

    console.log('[channel doesn\'t exist yet - local delegation');

    msg = JSON.parse( msg );

    console.log(msg.action);
  },


  message: function ( msg ) {

    INSTANCE.emit( 'message', msg );
  }

};
