/**
 *	Default
 *	=======
 *
 *	Default configurations for the network.
 */

pg.config = {

	server:	'http://localhost:2020'
};



var peerconfig = {

		iceServers:	[{

			url: !moz ? 'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
		}]
	},

	connectionConstraints = {

		optional: [{

			RtpDataChannels			: true
			// DtlsSrtpKeyAgreement	: moz ? null : true
		}]
	},

	mediaConstrains = {

		optional: [],

		mandatory: {

			OfferToReceiveAudio		: true,
			OfferToReceiveVideo		: true
		}
	};

if ( moz ) mediaConstrains.mandatory.MozDontOfferDataChannel = true;

peerconfig = null;
