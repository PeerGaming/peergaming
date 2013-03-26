/*jshint devel:true */
/*global pg:true */

(function(){

	'use strict';

	var name = 'test';

	setTimeout(function(){

		pg.login( name, function ( player ) {

			window.player = player;

			player.on('connection', function ( peer ) {

				console.log('[connected] ID: ' , peer.id );
			});

			player.on('message', function ( msg ) {

				console.log('[message]');

				console.log(msg);
			});
		});

	}, 1000);

})();
