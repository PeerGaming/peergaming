/**
 *  Media
 *  =====
 *
 *  Wrapper for handling MediaStreams - creating an additional connection asides the DataChannel.
 */


/**
 *  Constructor to setup up the basic information
 *
 *  @param  {String}  local       -
 *  @param  {String}  remote      -
 *  @param  {Boolean} initiator   -
 *  @param  {Object}  transport   -
 */

var Media = function ( local, remote, initiator, transport ) {

  this.info = { local: local, remote: remote, pending: true };

  if ( initiator ) this.info.initiator = true;
  if ( transport ) this.info.transport = transport;

  this.channels = {};

  this.init();
};


/**
 *  Create connection and setup receiver
 */

Media.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

  this.checkStateChanges();

  this.findICECandidates();

  if ( this.info.initiator ) {

    this.requestStream();
  }
};


/**
 *  Media <- Connection
 */

inherits( Media, Connection );


/**
 *  Attach handler for incoming streams
 */

Media.prototype.attachStream = function(){

  var conn = this.conn;

  conn.onaddstream = function ( e ) {

    console.log('[MEDIA] - Added Stream');
    console.log(e);

    // var video = document.createElement('video');
    // video.src = URL.createObjectURL( e.stream );
    // video.autoplay = true;

    // var box = document.createElement('div');
    // box.textContent = this.remoteID;
    // box.className = 'name';
    // box.appendChild(video);

    // document.body.appendChild( box );
  };


  conn.onremovestream = function ( e ) {

    console.log('[MEDIA] - Removed Stream');

    // document.getElementById('vid2').src = null;
    URL.revokeObjectURL( e.stream );
  };

};


/**
 *  Request media input via camera/microphone
 *
 *  @param {String} el   -
 */

Media.prototype.requestStream = function ( el ) {

  var permissions = { audio: true, video: true };

  win.navigator.getUserMedia( permissions, function ( stream ) {

    var videoTracks = stream.getVideoTracks(),
        audioTracks = stream.getAudioTracks();

    conn.addStream( stream );

    // this.createOffer();

    if ( !el ) return;

    var video = document.createElement('video');

    video.src      = createObjectURL( stream );
    video.autoplay = true;

    document.getElementById( el ).appendChild( video );
  });

};
