/*jshint devel:true */
/*global pg:true */

(function(){

	'use strict';

	var data = 'test';

	setTimeout(function(){

		pg.login( data, function ( player ) {

			window.player = player;

			player.on('connection', function ( peer ) {

				// console.log(peer);
				console.log('[connected] ID: ' , peer.id );
			});
		});

	}, 1000);

})();
