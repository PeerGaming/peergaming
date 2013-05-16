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

      this.send( 'init', { name: instance.account.name, list: Object.keys( instance.connections ) });
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],

          data = msg.data;

      utils.extend( peer, { account: { name: data.name } });

      instance.emit( 'connection', peer );

      // ToDo: refactor with .connect()
      // providing transport - register delegation
      instance.checkNewConnections( data.list, this );
    },

    close: function ( msg ) {

      console.log('[closed]');

      console.log(msg);
    }

  },


  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== instance.id ) {  // proxy || same as info.transport

      // just handler between - setting up for remote delegation
      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

      return instance.connections[ msg.remote ].send( 'register', msg.data, proxy );
    }

    if ( !instance.connections[ msg.local ] ) instance.connect( msg.local, false, this );

    instance.connections[ msg.local ][ msg.action ]( msg.data );
  },


  // here again: action can be called for remote handling...
  custom: function ( msg ) {

    console.log('[channel doesn\'t exist yet - local delegation');

    msg = JSON.parse( msg );

    console.log(msg.action);
  },


  message: function ( msg ) {

    instance.emit( 'message', msg );
  }

};
