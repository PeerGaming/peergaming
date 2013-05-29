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


var GAMES   = {},

    STARTER = null;


var Game = function ( id ) {

  this.init( id );

  // this.info    = {};                          // TODO: 0.6.0 -> data & info

  this.options = { minPlayer: 2, maxPlayer: 8 }; // TODO: 0.5.0 -> room options

  GAMES[ id ] = this;
};


utils.inherits( Game, Channel );


/** start a game as the minimum got reached **/
Game.prototype.start = function ( initialize ) {

  this._start = function(){ initialize(); forward.call( this ); };


  var ready = Object.keys( READY ).length;

  if ( ready  <  this.options.minPlayer ) return;     // less player  - wait

  if ( ready === this.options.minPlayer ) {           // condition

    if ( INSTANCE.pos === 0 ) this._start();

    return; // not 0 but same amount
  }

  if ( ready  >  this.options.minPlayer ) {          // more player   - late join

    if ( INSTANCE.pos >= this.options.minPlayer ) request();

    return;
  }

  // TODO: 0.5.0 -> maxPlayer will be handled
};


// request previous if ready
function request() {

  var keys = Object.keys( pg.peers ),
      curr = INSTANCE.pos;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    if ( curr - 1 === pg.peers[ keys[i] ].pos ) {

      return CONNECTIONS[ keys[i] ].send( 'start', { request: true });
    }
  }
}


// forward to the next peer : remoteID will be provided by late join !
function forward ( remoteID ) {

  STARTER = function(){

    STARTER = null;

    setTimeout(function(){

      var keys = Object.keys( pg.peers ),
          curr = INSTANCE.pos;

      for ( var i = 0, l = keys.length; i < l; i++ ) {

        if ( curr + 1 === pg.peers[ keys[i] ].pos ) {

          CONNECTIONS[ keys[i] ].send( 'start' );
          break;
        }
      }

      if ( this._start ) delete this._start;

    }.bind(this), DELAY * pg.data.length ); // see batching the changes

  }.bind(this);


  if ( !remoteID ) return; // get sync object

  var conn = CONNECTIONS[ remoteID ],

      keys = Object.keys( pg.sync ),

      prop;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    prop = keys[i];

    conn.send( 'sync', { resync: true, key: prop, value: pg.sync[prop] });
  }

  if ( STARTER ) STARTER();
}


// Game.prototype.end      = function(){};      // TODO: 0.6.0 -> player handling
// Game.prototype.pause    = function(){};      // TODO: 0.6.0 -> player handling
// Game.prototype.unpause  = function(){};      // TODO: 0.6.0 -> player handling

pg.game = createRoom( Game );
