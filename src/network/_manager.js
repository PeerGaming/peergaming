/**
 *  Manager
 *  =======
 *
 *  Helper for handling connections and delegate communication.
 */


var DELAY    =    0,  // max. latency evaluation

    PINGS    =    3,  // amount of packages to exchange for the latency test // 100

    READY    =   {},  // record of current ready users

    TODO     =   {},  // available peers to connect

    CURRENT  = null;  // current connection which is getting established


MANAGER = (function(){


  /**
   *  Check list for new connections
   *
   *  @param  {Array}  remoteList   -
   *  @param  {Object} transport    -
   */

  function check ( remoteList, transport ) {

    if ( !remoteList ) return;

    if ( !Array.isArray(remoteList) ) remoteList = [ remoteList ];

    var localID = PLAYER.id, remoteID;


    if ( !CURRENT ) {

      remoteID = remoteList.pop();

      this.connect( remoteID, true, transport );
    }


    if ( !remoteList.length ) return;

    for ( var i = 0, l = remoteList.length; i < l; i++ ) {

      remoteID = remoteList[i];

      if ( remoteID === localID || CONNECTIONS[ remoteID ] ) continue; // skip

      TODO[ remoteID ] = transport;
    }
  }


  /**
   *  Connect with the new peer
   *
   *  @param {String}  remoteID    -
   *  @param {Boolean} initiator   -
   *  @param {Object}  transport   -
   */

  function connect ( remoteID, initiator, transport ) {

    if ( CONNECTIONS[ remoteID ] || remoteID === PLAYER.id ) return;

    console.log( '[connect] to - "' + remoteID + '"' );

    CURRENT = remoteID; // currently connecting

    PEERS[ remoteID ] = new Peer({ id: remoteID });

    CONNECTIONS[ remoteID ] = new DataConnection( PLAYER.id, remoteID, initiator, transport );
  }


  // TODO -> check for "exchange & create", initiator...

  // use the existing data channel to exchange the credentials, still needs "initiator" flag, as new connection
  function share ( remoteID, initiator, config, callback ) {

    if ( MEDIAS[remoteID] || remoteID === PLAYER.id ) return;

    var transport = CONNECTIONS[remoteID];

    if ( !transport.ready ) return;

    MEDIAS[ remoteID ] = new MediaConnection( PLAYER.id, remoteID, initiator, transport, config, callback );
  }


  /**
   *  Clear references, triggers callbacks and re-orders on disconnection of a peer
   *
   *  @param {String} remoteID   -
   */

  function disconnect ( remoteID ) {

    var peer = PEERS[ remoteID ];

    if ( !peer ) return;

    delete READY[ remoteID ];

    WATCH.emit(  'disconnect',      peer );
    if ( ROOM ) ROOM.emit( 'leave', peer );


    CONNECTIONS[ remoteID ].close();

    DATA.splice( peer.pos, 1 );

    delete PEERS[ remoteID ];
    delete CONNECTIONS[ remoteID ];

    order();
  }


  /**
   *  Set credentials and create entries as SDP & candidates arrives
   *
   *  @param {Object} msg         -
   *  @param {Object} transport   -
   */

  function set ( msg, transport ) {

    if ( !CONNECTIONS[ msg.local] ) this.connect( msg.local, false, transport );

    CONNECTIONS[ msg.local ][ msg.action ]( msg.data );
  }


  /**
   *  Inform other peers about the key/value change by using a broadcast
   *  and updates the local backup
   *
   *  @param  {String}               key     -
   *  @param  {String|Number|Object} value   -
   */

  function update ( key, value ) {

    updateBackup();

    broadcast( 'update', { key: key, value: value }, true );
  }


  /**
   *  Transfering data to a specific group (as in this caste to all,
   *  its just like a broadcast).
   */

  function broadcast ( action, data, direct ) {

    var ids = getKeys( CONNECTIONS );

    for ( var i = 0, l = ids.length; i < l; i++ ) {

      CONNECTIONS[ ids[i] ].send( action, data, direct );
    }
  }


  var timer = {};

  /**
   *  Setup and tests the connection - benchmark the latency via ping/pong
   *
   *  @param {String}  remoteID   -
   *  @param {Number}  index      -
   *  @param {Boolean} pong       -
   */

  function setup ( remoteID, index, initiator ) {

    var data = timer[remoteID];

    if ( !data ) { // initial call - pong doesnt exist || ignore first time

      data = timer[remoteID] = [ PINGS + 1 ];

      return ping( remoteID, data, data[0] );
    }


    data[index] = win.performance.now() - data[index];

    if ( !INGAME ) progress( data[0] );

    if ( --data[0] > 0 ) return ping( remoteID, data, data[0] );

    // invoke partner afterwards
    if ( initiator ) CONNECTIONS[ remoteID ].send( 'ping', { 'remoteSetup': true }, true );

    var latency = data.reduce( sum ) / ( PINGS );

    PEERS[ remoteID ].latency = latency;

    DELAY = Math.max( DELAY, latency );

    ready();
  }

  function sum ( prev, curr ) { return prev + curr; }


  /**
   *  Sends pings to other peers
   *
   *  @param {String} remoteID  -
   *  @param {Array}  data      -
   *  @param {Number} next      -
   */
  function ping ( remoteID, data, next ) {

    data[next] = win.performance.now();

    CONNECTIONS[ remoteID ].send( 'ping', { 'index': next }, true );
  }



  var perc = 0;

  /**
   *  Provides feedback about the current progress
   *
   *  @param {Number} part   -
   */

  function progress ( part ) {

    part = PINGS - part;  // 0 -> 100

    var curr  = getKeys( PEERS ).length,
        diff  = getKeys( TODO  ).length,
        max   = diff + curr;

    part = ( curr * part / max ) |0;

    if ( part <= perc ) return;

    if ( ROOM ) ROOM.emit( 'progress', perc = part, max );

    // if ( perc === 99 ) perc = 0; // reset ?
  }


  /**
   *  Determines if all peers are connected and then emits the connections
   */

  function ready(){

    var keys  = getKeys( PEERS ),

        list  = [],

        peer;

    list[ PLAYER.pos ] = PLAYER;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      peer = PEERS[ keys[i] ];

      list[ peer.pos ] = peer;
    }


    var entry = getKeys( TODO ).pop();

    if ( entry ) {

      var transport = TODO[ entry ];

      delete TODO[ entry ];

      CURRENT = null;

      return MANAGER.check( entry, transport );
    }

    /** sort + emit users in order & prevent multiple trigger **/
    order();

    for ( i = 0, l = list.length; i < l; i++ ) {

      setTimeout( invoke, DELAY, list[i] );
    }


    function invoke ( peer ) {

      if ( READY[ peer.id ] ) return;

      READY[ peer.id ] = true;

      WATCH.emit( 'connection'      , peer );
      if ( ROOM ) ROOM.emit( 'enter', peer );
    }
  }


  /**
   *  Defines the peer order - ranked by the appearance / inital load
   */

  function order(){

    var keys  = getKeys( PEERS ),

        times = {};

    times[ PLAYER.time ] = PLAYER.id;

    for ( var i = 0, l = keys.length; i < l; i++ ) times[ PEERS[ keys[i] ].time ] = keys[i];

    var list = getKeys( times ).sort( rank ).map( function ( key ) { return times[key]; }),

        user;

    if ( list.length !== keys.length + 1 ) {

      var msg = 'Precision time conflict';

      WATCH.emit('error', { msg: msg, line: 340 });

      throw new Error( msg );
    }

    DATA.length = 0;

    for ( i = 0, l = list.length; i < l; i++ ) {

      user     = PEERS[ list[i] ] || PLAYER;

      user.pos = DATA.push( user.data ) - 1;
    }

    function rank ( curr, next ) { return curr - next; }
  }



  return {

    broadcast  : broadcast,
    check      : check,
    connect    : connect,
    disconnect : disconnect,
    share      : share,
    set        : set,
    update     : update,
    setup      : setup
  };

})();
