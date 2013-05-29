/**
 *  Manager
 *  =======
 *
 *  A helper for handling connections and delegate communication.
 *
 *  manager - internaly handling communication + tasks || refactor for player
 */

// used for structure
var DELAY    = 100; // TODO: 0.5.0 -> Math.max() of all latency values

var READY    = {};  // current ready users ! (! pg.data.length)


var Manager = (function(){


  // checkConnections,
  function check ( remoteList, transport ) {

    if ( !remoteList ) return;

    if ( !Array.isArray(remoteList) ) remoteList = [ remoteList ];

    var localID  = INSTANCE.id,

        remoteID;

    for ( var i = 0, l = remoteList.length; i < l; i++ ) {

      remoteID = remoteList[i];

      if ( remoteID !== localID && !CONNECTIONS[ remoteID ] ) {

        connect( remoteID, true, transport );
      }
    }
  }


  // find partners + connect || can be used by the dev via noServer as well
  function connect ( remoteID, initiator, transport ) {

    if ( CONNECTIONS[ remoteID ] ) return;

    // console.log( '[connect] to - "' + remoteID + '"' );

    pg.peers[ remoteID ]    = new Peer({ id: remoteID });

    CONNECTIONS[ remoteID ] = new Connection( INSTANCE.id, remoteID, initiator, transport );
  }


  // clears references + triggers callbacks on disconnect
  function disconnect ( remoteID ) {

    var peer = pg.peers[ remoteID ];


    delete READY[ remoteID ]; // just contains true

    INSTANCE.emit( 'disconnect', peer );
    ROOM    .emit( 'leave'     , peer );


    CONNECTIONS[ remoteID ].close();

    pg.data.splice( peer.pos, 1 );

    delete pg.peers[ remoteID ];
    delete CONNECTIONS[ remoteID ];

    order();
  }


  // setCredentials: create new reference + SDP & Candidates
  function set ( msg, transport ) {

    if ( !CONNECTIONS[ msg.local] ) connect( msg.local, false, transport );

    CONNECTIONS[ msg.local ][ msg.action ]( msg.data );
  }


  // change values through a *multicast*
  function update ( key, value ) {

    var ids = Object.keys( CONNECTIONS );

    for ( var i = 0, l = ids.length; i < l; i++ ) {

      CONNECTIONS[ ids[i] ].send( 'update', { key: key, value: value });
    }
  }


  // benchmark - sends a ping & receives a ping
  var timer   = {};

  function setup ( remoteID, index, pong ) {

    if ( !pong ) return ping( remoteID );

    var col = timer[ remoteID ];

    col[index] = win.performance.now() - col[index];

    if ( --col[0] > 0 ) return;

    pg.peers[ remoteID ].latency = col.reduce( sum ) / ( col.length - 1 );

    order();

    ready();

    function sum ( prev, curr ) { return prev + curr; }
  }


  function ping ( remoteID ) {

    var conn = CONNECTIONS[ remoteID ],

        num  = 100,

        col = timer[ remoteID ] = [ num ];

    for ( var i = 1; i <= num; i++ ) { col[i] = win.performance.now(); test( i ); }

    function test( i ) {

      setTimeout( function(){ conn.send( 'ping', { index: i }); }, rand() * num );
    }
  }


  function order(){

    var keys = Object.keys( pg.peers ),

        times = {};

    times[ INSTANCE.time ] = INSTANCE.id;

    for ( var i = 0, l = keys.length; i < l; i++ ) times[ pg.peers[ keys[i] ].time ] = keys[i];

    var list = Object.keys( times ).sort( rank ).map( function ( key ) { return times[key]; }),

        user;

    if ( list.length !== keys.length + 1 ) {

      return console.log('[ERROR] Precision time conflict.', list, keys );
    }

    pg.data.length = 0;

    for ( i = 0, l = list.length; i < l; i++ ) {

      user     = pg.peers[ list[i] ] || INSTANCE;

      user.pos = pg.data.push( user.data ) - 1;
    }

    function rank ( curr, next ) { return curr - next; }
  }



  // determines if no additional peer got addded - full connected !
  function ready(){

    var keys  = Object.keys( pg.peers ),

        list  = [],

        peer;

    list[ INSTANCE.pos ] = INSTANCE;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      peer = pg.peers[ keys[i] ];

      if ( !peer.time ) return;  // not ready yet

      list[ peer.pos ] = peer;
    }


    for ( i = 0, l = list.length; i < l; i++ ) setTimeout( invoke, DELAY, list[i] );

    // emit users in order & prevent multiple trigger of ready users
    function invoke( peer ) {


      if ( READY[ peer.id ] ) return;

      READY[ peer.id ] = true;

      INSTANCE.emit( 'connection', peer );
      ROOM    .emit( 'enter'     , peer );
    }
  }


  return {

    check      : check,
    connect    : connect,
    disconnect : disconnect,
    set        : set,
    update     : update,
    setup      : setup
  };

})();
