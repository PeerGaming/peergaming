/*jshint devel:true */
/*global pg:true */


(function(){

  'use strict';


  pg.routes('/test/');

  pg.channel( function ( channel, params ) {

    channel.on('enter', function ( user ) {

      console.log('[CHANNEL] User - ' , user.id );
    });

  });


  // just for example - as user is = player
  // if ( user.join ) user.join('/start-game/123/');

  // optional hooks (previous main channels for communicatin)
  pg.player.on('connection', function ( peer ) {

    console.log('[connected] ID: ' , peer.id );
  });


  pg.player.on('message', function ( msg ) {

    console.log('[message] - ' + JSON.parse(msg).data.msg );
  });


  pg.player.on('disconnect', function ( peer ) {

    console.log('[left] ID: ' + peer.id );
  });


  // channel.on('leave', function(){ console.log('leave'); });

  // pg.game( function ( game, params ) {

  //   game.on('enter', function ( user ) {

  //     console.log('[game entered]');

  //     console.log(user);


  //   });

    // game.on('leave', function(){});
    // game.on('start', function(){});
    // game.on('end', function(){});
    // game.on('pause', function(){});
    // game.on('reconnect', function(){});

  // });



  // login
  pg.login( 'test' );


})();

