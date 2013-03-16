var peers = {};

var peerlist = {

	handle: function ( msg, res ) {

		if ( this[msg.action] ) {

			this[msg.action].apply( this, [ msg, res ] );

		} else { console.log('Invalid command: ' + msg.action); }
	},


	remove: function ( msg, res ) {

		delete peers[ msg.data ];
		if ( res ) res.end();

		// console.log(Object.keys(peers).length);
	},




	// assign
	init: function ( id, res ) {

		peers[id] = res;

		if ( res.write ) {	// XHR - keep open

			res.write('\n\n');
		}
	},


	// request...// register... // noew you are also there...

	lookup: function ( msg, res ) {

		var partnerID = this.getPartner( msg.data );

		if ( res ) {

			res.end( partnerID );

		} else {

			var conn = peers[msg.data];

			conn.send( JSON.stringify(partnerID) );
		}
	},

	getPartner: function ( id ) {

		var keys = Object.keys(peers),
			partnerID = null;

		if ( keys.length > 1 ) {

			partnerID = keys[ ~~( Math.random() * keys.length ) ];
		}

		return ( partnerID !== id ) ? partnerID : this.getPartner( id );
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

		if ( conn.write ) {

			conn.write('data: ' + JSON.stringify( msg ) + '\n\n');

		} else {

			conn.send( JSON.stringify(msg) );
		}

		if ( res ) res.end();
	}

};


module.exports = peerlist;

