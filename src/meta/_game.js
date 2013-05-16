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
 */


var games  = {};


var Game = function ( id ) {

  Emitter.call( this );

  this.id = id;

  this.config = {

    minPlayer: 2,
    maxPlayer: 8

    // watchable: true
    // public, privated.., protected...
  };

};


utils.inherits( Game, Channel );


Game.prototype.info = function(){

  var info = {

    currentPlayers: 2,
    state: 'running'
  };

  return info;
};


// check for role | voting,as start -end etc. shouldnt be callable by the users afterwards....

Game.prototype.start = function(){


};

Game.prototype.end = function(){


};

Game.prototype.pause = function(){


};

Game.prototype.unpause = function(){


};






// 1:1 mapping for channel , on refactoring, just regards the .games[ id], and the ones above !


pg.game = function ( id, handler ) {

  if ( typeof id !== 'string' ) {

    handler = id;
    id      = '*';
  }

  var game = new Game( id );

  // typeof handler => function
  games[ id ] = createGame( handler, game );

  return game;
};


// you are entering....
function createGame ( handler, game ) {

  return function ( params ) {

    handler( game, params );

    game.emit( 'enter', instance ); // || peers[id]// see params etc.
  };
}
