var peers = {};

var peerlist = {

	handle: function ( msg, res ) {

		if ( this[msg.action] ) {

			this[msg.action].apply( this, [ msg, res ] );

		} else { console.log('Invalid command: ' + msg.action); }
	},


	remove: function ( msg, res ) {

		delete peers[ msg.data ];
		console.log(Object.keys(peers).length);
		res.end();
	},





	register: function ( msg, res ) {

		var keys = Object.keys(peers),
			partnerID = null;

		if ( keys.length ) {

			partnerID = keys[ ~~( Math.random() * keys.length ) ];
		}

		peers[ msg.data ] = {};

		res.end( partnerID );
	},


	// assign
	init: function ( id, res ) {

		peers[id] = res;
		res.write('\n\n'); // open
	},


	setIceCandidates: function ( msg, res ) {

		this.exchange( msg, res );
	},

	setConfigurations: function ( msg, res ) {

		this.exchange( msg, res );
	},


	// ICE & SDP
	exchange: function ( msg, res )  {

		var conn = peers[msg.remote];

		conn.write('data: ' + JSON.stringify( msg ) + '\n\n');

		res.end();
	}


};


module.exports = peerlist;



