/**
 *	Default
 *	=======
 *
 *	Default configurations for the network.
 */


var config = {

	channelConfig: {

		MAX_BYTES	: 1024,					// max bytes throughput of a DataChannel
		CHUNK_SIZE	:  600,					// size of the chunks - in which the data will be splitt
		CHUNK_DELAY	:  400					// time to delay sending chunks through a channel
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

		optional: [],

		mandatory: {										// required permissions

			OfferToReceiveAudio		: true,
			OfferToReceiveVideo		: true
		}
	}

};

if ( moz ) {

	config.mediaConstraints.mandatory.MozDontOfferDataChannel		= true;
	config.connectionConstraints.optional[0].DtlsSrtpKeyAgreement	= true;
}
