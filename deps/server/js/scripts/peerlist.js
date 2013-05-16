/**
 *  Peerlist
 *  ========
 *
 *  Brookering - seperating channels
 *
 */


var rooms = {};   // seperated by address


var peerlist = {

  handle: function ( msg, res ) {

    if ( this[ msg.action ] ) {

      // changed from msg -> msg.data
      this[ msg.action ].apply( this, [ msg, res ] );

    } else { console.log('Invalid command: ' + msg.action); }
  },


  remove: function ( msg, res ) {

    delete rooms[ msg.origin ][ msg.local ];

    if ( res ) res.end();
  },


  // assign
  init: function ( msg, res ) {

    if ( !rooms[ msg.origin ] ) rooms[ msg.origin ] = {};

    rooms[ msg.origin ][ msg.local ] = res;

    // XHR - keep open
    if ( res.write ) res.write('\n\n');
  },


  // request...// register...
  lookup: function ( msg, res ) {

    var partnerID = this.getPartner( msg.origin, msg.local );

    if ( res ) return res.end( partnerID );

    var conn = rooms[ msg.origin ][ msg.local ];

    conn.send( JSON.stringify(partnerID) );
  },


  getPartner: function ( addr, id ) {

    var keys = Object.keys( rooms[ addr ] ),

        partnerID = null;

    if ( keys.length > 1 ) partnerID = keys[ ~~( Math.random() * keys.length ) ];

    return ( partnerID !== id ) ? partnerID : this.getPartner( addr, id );
  },


  // ICE & SDP
  setIceCandidates  : function() {  this.exchange.apply( this, arguments );  },
  setConfigurations : function() {  this.exchange.apply( this, arguments );  },

  exchange: function ( msg, res )  {

    var conn = rooms[ msg.origin ][ msg.remote ];

    if ( conn.send ) {

      conn.send( JSON.stringify( msg ) );

    } else {

      conn.write('data: ' + JSON.stringify( msg ) + '\n\n');
    }

    if ( res ) res.end();
  }

};

module.exports = peerlist;
