/**
 *  Manager
 *  =======
 *
 *  A helper for handling connections and delegate communication.
 *
 *  manager - internaly handling communication + tasks || refactor for player
 */

// used for structure
var priorityList = [];


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
  }


  // clears references + triggers callbacks on disconnect
  function disconnect ( remoteID ) {

    INSTANCE.emit( 'disconnect', pg.peers[ remoteID ] );

    pg.data.splice( dataMap[remoteID], 1 );

    delete pg.peers[ remoteID ];
    delete CONNECTIONS[ remoteID ];
  }


  // setCredentials: create new reference + SDP & Candidates
  function set ( msg, transport ) {

    if ( !CONNECTIONS[ msg.local] ) connect( msg.local, false, transport );

    CONNECTIONS[ msg.local ][ msg.action ]( msg.data );
  }


  // change values through a *multicast*
  function update ( key, value ) {

    // share with all
    console.log('[changed] ' + key + ': ' + value );
  }


  // sends a ping - if used with the right parameter | used for starting the benchmark
  function ping(){

  }

  // runs test - measures time for sending packages etc. || later + running tests through creating bytearrays !
  // function benchmark(){}

  return {

    check      : check,
    connect    : connect,
    disconnect : disconnect,
    set        : set,
    update     : update,
    ping       : ping
  };

})();
