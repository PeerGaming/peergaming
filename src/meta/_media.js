/**
 *  Media
 *  =====
 *
 *	Handler just for mediastreaming (video & audio). Additional connection - which can be used
 *	besides the current handler/connection.
 */



// attachMediaStreams()


	// Connection.prototype.handleIncomingStreams = function(){

	// 	var conn = this.conn;

	// 	conn.onaddstream = function ( e ){

	// 		console.log('[added stream]');
	// 		console.log(e);
			// var video = document.createElement('video');
			// video.src = URL.createObjectURL( e.stream );
			// video.autoplay = true;

			// var box = document.createElement('div');
			// box.textContent = this.remoteID;
			// box.className = 'name';
			// box.appendChild(video);

			// document.body.appendChild( box );
			//


		// var remoteMediaStream=evt.stream;
		            // if(remoteMedia==null){
		            // remoteMedia=remoteMediaStream;
		            // }
		            // else
		            // {
		            //     remoteMedia.addTrack(remoteMediaStream.getVideoTracks()[0]); //add the video track to the existing stream
		            // }
		            // if(remoteVideo!=null)  {
		            // //    $(remoteVideo).remove();
		            //     //remoteVideo=null;
		            // }

		// }.bind(this);

		// conn.onremovestream = function ( e ) {

		// 	console.log('[removed stream]');

			// document.getElementById('vid2').src = null;
			// URL.revokeObjectURL( e.stream );
		// };


		// window.test = function(){

			// device access
			// var permissions = { audio: true, video: true };

			// navigator.getUserMedia( permissions, function ( stream ) {


			// 	var videoTracks = stream.getVideoTracks(),
			// 		audioTracks = stream.getAudioTracks();

			// 	// this.stream = stream;
			// 	console.log(conn);
			// 	conn.addStream( stream );

				// var video = document.createElement('video');

				// video.src = URL.createObjectURL(stream);
				// video.autoplay = true;

				// document.body.appendChild( video );

	// 		}.bind(this));

	// 	}.bind(this);
	// };






	// Connection.prototype.handleIncomingStreams = function(){

	// 	var conn = this.conn;

	// 	conn.onaddstream = function ( e ){

	// 		console.log('[added stream]');
	// 		console.log(e);
			// var video = document.createElement('video');
			// video.src = URL.createObjectURL( e.stream );
			// video.autoplay = true;

			// var box = document.createElement('div');
			// box.textContent = this.remoteID;
			// box.className = 'name';
			// box.appendChild(video);

			// document.body.appendChild( box );
			//


		// var remoteMediaStream=evt.stream;
		            // if(remoteMedia==null){
		            // remoteMedia=remoteMediaStream;
		            // }
		            // else
		            // {
		            //     remoteMedia.addTrack(remoteMediaStream.getVideoTracks()[0]); //add the video track to the existing stream
		            // }
		            // if(remoteVideo!=null)  {
		            // //    $(remoteVideo).remove();
		            //     //remoteVideo=null;
		            // }

		// }.bind(this);

		// conn.onremovestream = function ( e ) {

		// 	console.log('[removed stream]');

			// document.getElementById('vid2').src = null;
			// URL.revokeObjectURL( e.stream );
		// };


		// window.test = function(){

			// device access
			// var permissions = { audio: true, video: true };

			// navigator.getUserMedia( permissions, function ( stream ) {

				// var videoTracks = stream.getVideoTracks(),
					// audioTracks = stream.getAudioTracks();

				// conn.addStream( stream );


				// this.stream = stream;
				// var video = document.createElement('video');

				// video.src = URL.createObjectURL(stream);
				// video.autoplay = true;

				// document.body.appendChild( video );

	// 		}.bind(this));

	// 	}.bind(this);
	// };
