/**
 *  Game
 *  ====
 *
 *  A room for handling gaming specific requirements.
 */


var GAMES   = {},     // record of games

    STARTER = null;   // bootstrap to forward the game start


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

  this.info    = {};                             // TODO: 0.6.0 -> data & info

  this.options = { minPlayer: 2, maxPlayer: 8 }; // TODO: 0.5.0 -> room options

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


  var ready = Object.keys( READY ).length;

  if ( ready  <  this.options.minPlayer ) return;     // less player  - wait

  if ( ready === this.options.minPlayer ) {

    if ( PLAYER.pos === 0 ) this._start();

    return;
  }

  if ( ready  >  this.options.minPlayer ) {          // more player   - late join

    if ( PLAYER.pos >= this.options.minPlayer ) request();

    return;
  }

  // TODO: 0.5.0 -> maxPlayer will be handled
};


Game.prototype.end      = function(){};  // TODO: 0.6.0 -> player handling

Game.prototype.pause    = function(){};  // TODO: 0.6.0 -> player handling

Game.prototype.unpause  = function(){};  // TODO: 0.6.0 -> player handling



/**
 *  Ask the previous peer if your allowed/ready to start | late-join
 */

function request() {

  var keys = Object.keys( PEERS ),
      curr = PLAYER.pos;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    if ( curr - 1 === PEERS[ keys[i] ].pos ) {

      return CONNECTIONS[ keys[i] ].send( 'start', { request: true });
    }
  }
}


/**
 *  Invokes the start of the next peers
 *
 *  @param {String} remoteID   - will be provided by late join & request
 */

function forward ( remoteID ) {

  STARTER = function(){

    STARTER = null;

    setTimeout(function(){

      var keys = Object.keys( PEERS ),
          curr = PLAYER.pos;

      for ( var i = 0, l = keys.length; i < l; i++ ) {

        if ( curr + 1 === PEERS[ keys[i] ].pos ) {

          CONNECTIONS[ keys[i] ].send( 'start' );
          break;
        }
      }

      if ( this._start ) delete this._start;

    }.bind(this), DELAY * 5 ); // see batching the changes

  }.bind(this);


  if ( !remoteID ) return;


  /** get sync object **/

  var conn = CONNECTIONS[ remoteID ],

      keys = Object.keys( pg.sync ),

      prop;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    prop = keys[i];

    conn.send( 'sync', { resync: true, key: prop, value: pg.sync[prop] });
  }

  if ( STARTER ) STARTER();
}
