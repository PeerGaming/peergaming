/**
 *  Manager
 *  =======
 *
 *  Connection Manager, which handles the communication and data connections.
 */


// var manager


var Manager = {

  update: function ( key, value ) {


    console.log('[changed] ' + key + ': ' + value );
  }




};


// handles types of connection: data connection or media connection (the firstis based on datachannel,
//      the other on mediastream - which can be used to broadcast e.g. video streams)




  // function sendToServer ( action, data ) {

  // }


  // // every channel defines its own action
  // function sendToPeer ( channel, data ) {

  // }
