;(function ( name, context, definition ) {

	if ( typeof module !== 'undefined' ) {

		module.exports = definition( context );

	} else if ( typeof define !== 'undefined' ) {

		define( name, function(){ return definition( context ); });

	} else {

		context[name] = definition( context );
	}

})( 'pg', this, function ( context, undefined ) {

	//= require "core"
	//= require "utils"
	//= require "struct"
	//= require "network"
	//= require "meta"
	//= require "game"

  /** API **/

  extend( pg, {

    'noConflict'  : noConflict,       // -> core/_base.js
    'VERSION'     : VERSION,          // -> core/_base.js
    'info'        : INFO,             // -> meta/_info.js

    'config'      : setConfig,        // -> core/_config.js
    'login'       : login,            // -> meta/_login.js

    'player'      : PLAYER,           // -> game/_player.js
    'peers'       : PEERS,            // -> game/_peers.js
    'data'        : DATA,             // -> game/_peers.js
    'sync'        : SYNC,             // -> game/_sync.js

    'loop'        : loop,             // -> game/_loop.js

    'channel'     : setChannel,       // -> meta/_channel.js
    'game'        : setGame,          // -> meta/_game.js
    'routes'      : setRoutes         // -> meta/_routes.js
  });

	return pg;
});
