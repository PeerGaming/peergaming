/**
 *	Default
 *	=======
 *
 *	Default configurations for the network.
 */


var config = {

	channelConfig: {

		BANDWIDTH	: 1024 * 1000,		// 1MB			// prev:  1638400	|| 1600 - increase DataChannel width

		MAX_BYTES	: 1024 *   1,		// 1kb			// max bytes throughput of a DataChannel
		CHUNK_SIZE	:  600								// size of the chunks - in which the data will be splitt
	},


	socketConfig: {

		server: 'ws://localhost:2020'		// bootstrapping server address
	},


	peerConfig: {

		iceServers:	[{

			url: !moz ? 'stun:stun.l.google.com:19302' :	// address for STUN / ICE server
						'stun:23.21.150.121'
		}]
	},



	connectionConstraints: {

		optional: [{

			RtpDataChannels			: true					// enable DataChannel
		}]
	},



	mediaConstraints: {

		mandatory: {										// required permissions

			OfferToReceiveAudio		: true,
			OfferToReceiveVideo		: true
		},

		optional: []
	},

	videoConstraints: {										// e.g. android

		mandatory: {

			maxHeight	: 320,
			maxWidth	: 240
		},

		optional: []
	}

};

if ( moz ) {

	config.mediaConstraints.mandatory.MozDontOfferDataChannel		= true;
	config.connectionConstraints.optional[0].DtlsSrtpKeyAgreement	= true;
}
