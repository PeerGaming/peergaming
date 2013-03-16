/**
 *  Login
 *  =====
 *
 *  can be used after handling authentication - wrapper to preset the Peer !
 */


pg.login = (function(){

	var login = function ( data, next ) {

		var name = data.name || data,

			player = pg.Player( name );

		next( player );
	};


	return login;

})();
