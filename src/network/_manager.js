/**
 *  Manager
 *  =======
 *
 *  A helper for handling connections and delegate communication.
 *
 *  manager - internaly handling communication + tasks || refactor for player
 */

// used for structure
var LATENCY      = {},
    priorityList = [];


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

    console.log( '[connect] to - "' + remoteID + '"' );

    CONNECTIONS[ remoteID ] = new Connection( INSTANCE.id, remoteID, initiator, transport );

    pg.peers[ remoteID ] = new Peer({ id: remoteID });


    // unify structure: redefine index + position for data
    var list = Object.keys( pg.peers ).concat([ INSTANCE.id  ]).sort( order ),

        user; // player + peers

    pg.data.length = 0;

    for ( var i = 0, l = list.length; i < l; i++ ) {

      user = pg.peers[ list[i] ] || INSTANCE;

      user.pos = pg.data.push( user.data ) - 1;
    }

    function order ( curr, next ) { return utils.getHash(next) - utils.getHash(curr); }
  }


  // clears references + triggers callbacks on disconnect
  function disconnect ( remoteID ) {

    var peer = pg.peers[ remoteID ];

    INSTANCE.emit( 'disconnect', peer );
    ROOM    .emit( 'leave'     , peer );

    CONNECTIONS[ remoteID ].close();

    pg.data.splice( peer.pos, 1 );

    delete pg.peers[ remoteID ];
    delete CONNECTIONS[ remoteID ];
  }


  // setCredentials: create new reference + SDP & Candidates
  function set ( msg, transport ) {

    if ( !CONNECTIONS[ msg.local] ) connect( msg.local, false, transport );

    if ( msg.action ==='update') console.log(msg);

    CONNECTIONS[ msg.local ][ msg.action ]( msg.data );
  }


  // change values through a *multicast*
  function update ( key, value ) {

    var ids = Object.keys( CONNECTIONS );

    // share with all
    for ( var i = 0, l = ids.length; i < l; i++ ) {

      CONNECTIONS[ ids[i] ].send( 'update', { key: key, value: value });
    }
  }




  var diff, start;


  function pong ( remoteID, data ) {

    var end = win.performance.now();

    diff = end - start;

    console.log( diff );
  }



  var timer = {};

  // sends a ping - if used with the right parameter | used for starting the benchmark
  function test ( remoteID, index, pong ) {

    var col;

    if ( !pong ) {

      var conn = CONNECTIONS[ remoteID ],

          num  = 100;

      col = timer[ remoteID ] = [ num ];

      for ( var i = 1; i <= num; i++ ) {

        col[i] = win.performance.now();

        conn.send( 'ping', { index: i });
      }

      return;
    }


    col = timer[ remoteID ];

    col[index] = win.performance.now() - col[index];

    if ( --col[0] > 0 ) return;

    var mean = col.reduce( sum ) / ( col.length - 1 );

    // check the latency
    LATENCY[ remoteID ] = mean;


    // sort - ID - times to priority list
    //priorityList
  }

  function sum ( prev, curr ) { return prev + curr; }


  return {

    check      : check,
    connect    : connect,
    disconnect : disconnect,
    set        : set,
    test       : test,
    update     : update
  };

})();
