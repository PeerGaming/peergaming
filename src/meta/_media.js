/**
 *  Media
 *  =====
 *
 *  Handler just for mediastreaming (video & audio). Additional connection - which can be used
 *  besides the current handler/connection.
 *
 *  // include _media in meta !
 */

// handles types of connection: data connection or media connection (the firstis based on datachannel,
// the other on mediastream - which can be used to broadcast e.g. video streams)
// this.test = 1;
// ICE wird vor dem 2.offer gesetzt und ist evlt in kompatible
// 10 candiadtes - just after received offer - answer...  // second offer !

// this.channels[ label ] = new Handler( channel, this.remote, label );
// handler = new Handler( channel, this.remote, label );

var Media = function ( local, remote, initiator, transport ) {

  this.info = { local: local, remote: remote, pending: true };

  if ( initiator ) this.info.initiator = true;
  if ( transport ) this.info.transport = transport;

  this.channels = {};

  this.init();
};


Media.prototype.init = function(){

  this.conn = new RTCPeerConnection( config.peerConfig, config.connectionConstraints );

  this.checkStateChanges();

  this.findICECandidates();

  if ( this.info.initiator ) {

    this.requestStream();
  }
};


utils.inherit( Media, Connection );


Media.prototype.attachStream = function(){

  var conn = this.conn;

  conn.onaddstream = function ( e ) {

    console.log('[added stream]');
    console.log(e);

    var video = document.createElement('video');
    video.src = URL.createObjectURL( e.stream );
    video.autoplay = true;

    var box = document.createElement('div');
    box.textContent = this.remoteID;
    box.className = 'name';
    box.appendChild(video);

    document.body.appendChild( box );
  };


  conn.onremovestream = function ( e ) {

    console.log('[removed stream]');

    document.getElementById('vid2').src = null;
    URL.revokeObjectURL( e.stream );
  };

};


Media.prototype.requestStream = function ( el ) {

  // device access
  var permissions = { audio: true, video: true };

  win.navigator.getUserMedia( permissions, function ( stream ) {

    var videoTracks = stream.getVideoTracks(),
        audioTracks = stream.getAudioTracks();

    conn.addStream( stream );

    // this.createOffer();

    // local representation
    if ( !el ) return;

    var video = document.createElement('video');

    video.src      = createObjectURL( stream );
    video.autoplay = true;

    document.getElementById( el ).appendChild( video );
  });

};
