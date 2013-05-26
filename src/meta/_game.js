/**
 *  Game
 *  ====
 *
 *  Game room for handling game specific issues.
 *
 *
 *  Example:
 *
 *    pg.game('cool', function( game ){
 *
 *      console.log( game ); *
 *    });
 *
 *  ## Events
 *
 *  In addition to the channel events, following can occour as well:
 *
 *  - 'start'     : as the game starts
 *  - 'end'       : as the game ends
 *  - 'pause'     : as the game pauses
 *  - 'reconnect' : as a peer reconnect
 */


var GAMES  = {};


var Game = function ( id ) {

  this.init( id );

  this.info = {};

  //{ currentPlayers: 2, state: 'running' };
  // watchable: true // public, privated.., protected...
  // this.config = { minPlayer: 2, maxPlayer: 8 };
};


utils.inherits( Game, Channel );

// check for role | voting,as start -end etc. shouldnt be callable by the users afterwards....

Game.prototype.start    = function(){};
Game.prototype.end      = function(){};
Game.prototype.pause    = function(){};
Game.prototype.unpause  = function(){};

pg.game = createRoom( Game );
