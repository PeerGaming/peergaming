/**
 *  MediaConnection
 *  ===============
 *
 *  Wrapper for handling MediaStreams - creating an additional connection asides the DataChannel.
 *
 *
    // https://groups.google.com/forum/?fromgroups#!topic/discuss-webrtc/0CsB2dztSJI
    https://gist.github.com/yoeran/5983887
 */
  // TODO: automatic errorhandle retrieves mesage etc., if remote result won't be displayed....
  // send request to create the Media() also on the remote system !
  // still needs to create a peerconnection as the foundation

// inlcude improve audio playback, through using a audio context...
//
//
  // will change to: MediaStreamAudioSourceNode
  // http://stackoverflow.com/questions/17332711/is-there-any-way-to-use-createmediastreamsource-on-an-audiocontext-in-firefox-23



var MediaConnection = function ( local, remote, initiator, transport, config, callback ) {

  Connection.apply( this, arguments );

  this.init();

  this.info.config = config;

  this.attachStream();

  if ( this.info.initiator ) {

    this.requestStream( callback );
  }

};


/**
 *  Media <- Connection
 */

inherits( MediaConnection, Connection );


/**
 *  Attach handler for incoming streams
 */

MediaConnection.prototype.attachStream = function(){

  var conn = this.conn;

  conn.onaddstream = function ( e ) { // remote via connection != local, -> therefore otherhandler

    var stream = e.stream;

    if ( !eventMap[PLAYER.id].media ) return useDefaultAudio( stream );

    PLAYER.emit( 'media', stream, this.info.remote );

  }.bind(this);


  conn.onremovestream = function ( e ) {

    console.log('[MEDIA] - Removed Stream');

    // document.getElementById('vid2').src = null;
    URL.revokeObjectURL( e.stream );

  }.bind(this);

};


/**
 *  Request media input via camera/microphone
 *
 *  @param {String} el   -
 */

MediaConnection.prototype.requestStream = function ( callback ) {

  var permissions = this.info.config || config.permissions;

  nav.getUserMedia( permissions, success.bind(this), fail.bind(this) );


  function success ( stream ) {

    // var videoTracks = stream.getVideoTracks(),
        // audioTracks = stream.getAudioTracks();

    // filterAudio( stream );

    this.conn.addStream( stream );

    this.createOffer();

    if ( callback ) callback( stream );
  }

  function fail ( err ) {

    console.log('[DENIED] - ', err );
  }

};


/**
 *  Select the messeneger for communication & transfer
 *
 *  @param {String}  action   -
 *  @param {Object}  data     -
 *  @param {Boolean} direct   - defines if the action should only be execute via a direct connection
 */

MediaConnection.prototype.send = function ( action, data ) {

  this.info.transport.send( 'media', { action: action, data: data });
};



function filterAudio ( stream ) {

  var atx      = new AudioContext(),
      input    = atx.createMediaStreamSource( stream ),
      analyser = atx.createAnalyser(),
      filter   = atx.createBiquadFilter(),
      volume   = atx.createGainNode();


  input.connect( analyser);

  analyser.connect( filter );

  filter.connect( volume );

  volume.gain.value = 0.8;

  volume.connect( atx.destination );

  console.log('[AUDIO] ', atx);
}


function useDefaultAudio ( stream ) {

  // filterAudio( stream );

  var audio = new Audio();

  audio.src = URL.createObjectURL( stream );

  audio.autoplay = true;

  audio.load();
}
