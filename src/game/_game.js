/**
 *  Game
 *  ====
 *
 *  A room for handling gaming specific requirements.
 */


var GAMES = {}; // record of games


/**
 *  Shortcut to setup a game handler
 */

var setGame = createRoom( Game );


/**
 *  Constructor to define the reference and options
 *
 *  @param {String} id   -
 */

function Game ( id ) {

  this.init( id );

  this.info    = {};                              // TODO: 0.6.0 -> data & info

  this.options = { minPlayer: 2, maxPlayer: 10 }; // TODO: 0.6.0 -> room options

  GAMES[ id ] = this;
}


/**
 *  Game <- Channel <- Emitter
 */

inherits( Game, Channel );


/**
 *  Starts the game as the minimum amount of players joined
 *
 *  @param {Function} initialize   - bootstrapping function to start the game
 */

Game.prototype.start = function ( initialize ) {

  this._start = function(){ initialize(); forward.call( this ); };


  var ready = getKeys( READY ).length;

  if ( INGAME ) return;

  if ( ready  <  this.options.minPlayer ) return;   // less player - wait

  if ( ready === this.options.minPlayer ) {

    if ( PLAYER.pos === 0 ) {

      if ( !INGAME ) return this._start();

      // re-join to minmum | prevent reset (won't be called cause the return in line 57 ?)
      forward.call( this, getKeys(PEERS)[0] );
    }

    return;
  }

  if ( ready  >  this.options.maxPlayer ) return;   // too much player

  request();

  // TODO: 0.6.0 -> handle min-/maxPlayer messages
};



/**
 *  Define game options like the amount of players
 *
 *  @param  {Object} options    -
 */

// Game.prototype.config = function ( options ) {

//   extend( this.options, options );
// };


Game.prototype.end      = function(){ INGAME = false; };  // TODO: 0.6.0 -> player handling

Game.prototype.pause    = function(){};                   // TODO: 0.6.0 -> player handling

Game.prototype.unpause  = function(){};                   // TODO: 0.6.0 -> player handling



/**
 *  Ask the previous peer if your allowed/ready to start | late-join
 */

function request(){

  var remoteID = getPrevious();

  if ( !remoteID ) return; // entry

  CONNECTIONS[ remoteID ].send( 'start', { request: true }, true );
}


/**
 *  Invokes the start of the next peers
 *
 *  Provide a snapshot from the current pg.sync object from the previous player,
 *  used to ensure sync (!= cache) and data.
 *
 *  @param {String} remoteID   - will be provided by late join & request
 */

function forward ( remoteID, late ) {

  if ( !remoteID ) remoteID = getNext();

  if ( checkCaches() ) return setTimeout( forward, DELAY, remoteID );

  if ( !remoteID ) { // end of chain - start loop

    MANAGER.broadcast( 'start', { sync: JSON.stringify(SYNC), loop: true });

    return setTimeout( startLoop, SYNCDELAY+DELAY ); // local delay for synchronized order
  }

  CONNECTIONS[ remoteID ].send( 'start', { sync: JSON.stringify(SYNC), belated: late }, true );
}



/**
 *  Returns the ID of the next player in the peerchain
 *  @return {String}   - remoteID
 */

function getNext(){

  var keys = getKeys( PEERS ),
      curr = PLAYER.pos;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    if ( curr + 1 === PEERS[ keys[i] ].pos ) return keys[i];
  }

}


/**
 *  Returns the ID of the previous player in the peerchain
 *  @return {String}   - remoteID
 */

function getPrevious(){

  var keys = getKeys( PEERS ),
      curr = PLAYER.pos;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    if ( curr - 1 === PEERS[ keys[i] ].pos ) return keys[i];
  }

}
