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

        account: INSTANCE.account,
        time   : INSTANCE.time,
        list   : Object.keys( CONNECTIONS )
      });

      // exchange initial data
      var data = INSTANCE.data,
          keys = Object.keys( data );

      for ( var i = 0, l = keys.length; i < l; i++ ) {

        Manager.update( keys[i], data[ keys[i] ] );
      }
    },

    end: function ( msg ) {

      msg = JSON.parse( msg );

      var peer = pg.peers[ this.info.remote ],
          data = msg.data;

      peer.time    = data.time;
      peer.account = data.account;

      Manager.check( data.list, this  );
      Manager.setup(  this.info.remote );
    },

    close: function ( msg ) {  /* console.log('[DatChannel closed]'); */ }
  },


  // just handler between - setting up for remote delegation
  register: function ( msg ) {

    msg = JSON.parse( msg );

    if ( msg.remote !== INSTANCE.id ) {  // proxy -> info.transport

      // console.log( '[proxy] ' + msg.local + ' -> ' + msg.remote );

      var proxy = { action: msg.action, local: msg.local, remote: msg.remote };

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


  update: function ( msg ) {

    msg = JSON.parse( msg );

    var value = msg.data.value;

    // 1
    pg.peers[ msg.local ].data[ msg.data.key ] = msg.data.value;

    // 2
    //if ( pg.peers[ msg.local ].data[ msg.data.key ] ) return;

    // Object.defineProperty( pg.peers[ msg.local ].data, msg.data.key, {

    //   enumeable    : true,
    //   configurable : true,
    //   get          : function(){ return value; };
    //   writeable    : false
    // });

    // 3
    // Object.defineProperty( pg.peers[ msg.local ].data, msg.data.key, {

    //   value        : msg.data.value,
    //   enumeable    : true,
    //   configurable : true,
    //   writeable    : false
    // });

    // console.log('[update] ', msg.data.key + ':' + msg.data.value );
  },


  sync: function ( msg ) {

    msg = JSON.parse( msg );

    resync( msg.local, msg.data.key, msg.data.value );

    // if ( msg.data.resync ) return


    // var key   = msg.data.key,
    //     value = msg.data.value;

    // if ( !CACHE[key] ) {

    //  CACHE[key] = { value: value };

    //  console.log('[set cache]', value );

    // } else {

    //   console.log('[load cache]', CACHE[key].value );
    // }

    // // console.log( '[sync] ', key , ' : ', value );

    // this.send( 'resync', { resync: true, key: key, value: CACHE[key].value });


    // set value in local cache ! || who ever got faster with setting the value | define throuhg random
    // id - as iterating first ... same
    // wait one tick
    // setImmediate(function(){ console.log(CACHE[key]); });
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
