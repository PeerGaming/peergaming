/**
 *  Sync
 *  ====
 *
 *  A synchronized shared object - which accessible by all users.
 */


/**
 *  Public interface for the synchronize object
 *
 *  @type {[type]}
 */

pg.sync = getReactor( batch(sync) );


var CACHE  = {},  // record of still pending properties

    SOLVED = {};  // temporary list for confirmed values


/**
 *  Combine multiplee changes to one batch,
 *  to process them as one and avoid unrequired network transfer
 *
 *  @param  {Function} fn    -
 *  @return {Function}
 */

function batch ( fn ) {

  var list      = {},

      timeoutID = null;


  function share()  {

    timeoutID = null;

    var keys = Object.keys(list),

        prop;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      prop = keys[ i ];

      sync( prop, list[ prop ] );

      delete list[ prop ];
    }

    /** defined in game -> forward **/
    if ( STARTER ) STARTER();
  }


  return function ( key, value ) {

    list[key] = value;

    if ( timeoutID ) clearTimeout( timeoutID );

    timeoutID = setTimeout( share, DELAY );
  };
}


/**
 *  Share the property (key/value) with other peers
 *
 *  @param  {String}               key         -
 *  @param  {String|Number|Object} value       -
 *  @param  {Boolean}              confirmed   -
 */

function sync ( key, value, confirmed ) {

  if ( confirmed ) {

    if ( !CACHE[key] || CACHE[key].results[ INSTANCE.pos ] !== value ) {

      SOLVED[ key ]  = true;
      pg.sync[ key ] = value;
    }

    delete CACHE[key];        // console.log( '[CONFIRMED]', value    );
    return;
  }


  if ( CACHE[ key ] ) return; // console.log( '[CACHED]', CACHE[key]  );

  if ( SOLVED[ key ] ) {      // console.log( '[SOLVED]', SOLVED[key] );

    delete SOLVED[key];
    return;
  }

  var ids = Object.keys( CONNECTIONS );

  // TODO: 0.6.0 -> conflict with multiple ?
  CACHE[key] = { list: ids, results: [] };

  CACHE[key].results[ INSTANCE.pos ] = value;

  for ( var i = 0, l = ids.length; i < l; i++ ) {

    CONNECTIONS[ ids[i] ].send( 'sync', { key: key, value: value });
  }
}


/**
 *  Exchange value with remote data & merge on conflict
 *
 *  @param  {String} remoteID   -
 *  @param  {String} key        -
 *  @param  {String} value      -
 */

function resync ( remoteID, key, value ) {

  if ( !CACHE[key] ) { // noConflict

    sync( key, value, true );

    return CONNECTIONS[ remoteID ].send( 'sync', { resync: true, key: key, value: value });
  }

  // TODO: 0.6.0 -> handle conflict (lower pos)
  console.log('[CONFLICT]');

  // var entry = CACHE[key];

  // entry.list.length -= 1;

  // entry.results[ pg.peers[remoteID].pos ] = value;

  // if ( entry.list.length ) return;
}
