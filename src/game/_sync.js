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

SYNC = getReactor( batch(sync) );


var CACHE    = {},  // record of still pending properties

    SOLVED   = {},  // temporary list for confirmed values

    // SYNCNO   =  0,  // version tracking , 0.8

    SYNCFLOW = {    // steps for synchronisation

      'request' : requestSync,
      'confirm' : confirmSync
    };


/**
 *  Combine multiple changes to one batch,
 *  to process them as one and avoid unrequired network transfer,
 *  especially as complex objects or arrays can be transfered and
 *  else each property would be synced with one transmission !
 *
 *  @param  {Function} fn    -
 *  @return {Function}
 */

function batch ( fn ) {

  var list      = {},

      timeoutID = null;


  function share()  {

    timeoutID = null;

    var keys = getKeys(list),

        prop;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

      prop = keys[ i ];

      sync( prop, list[ prop ] );

      delete list[ prop ];
    }

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

function sync ( key, value, resync ) {

  var resolved = !handleCaches.apply( this, arguments );

  if ( resolved ) return;

  var ids = getKeys( CONNECTIONS );

  CACHE[key] = { list: ids, results: [] };

  CACHE[key].results[ PLAYER.pos ] = value;

  MANAGER.broadcast( 'sync', { action: 'request', key: key, value: value }, true );

  if ( !config.synchronConfig.naiveSync ) {

    // advancedSync
    pg.sync[ key ] = void 0;
    loop.stop();
  }

  // SYNCNO++;   // 0.8 -> improve conflict solving, using versioning for the caches & sync
  // MANAGER.broadcast( 'sync', { version: SYNCNO, action: 'request', key: key, value: value }, true );
}


/**
 *  [handleCaches description]
 *
 *  // returns true if it shouldn't be shared/sent to remote peers
 *  // remote setting their local value || // also not set on the local environment
 *
 *  @param  {[type]} key    [description]
 *  @param  {[type]} value  [description]
 *  @param  {[type]} resync [description]
 *  @return {[type]}        [description]
 */

function handleCaches ( key, value, resync ) {

  if ( resync ) {

    // console.log('[SOLVED]');

    if ( CACHE[key] ) delete CACHE[key];

    SOLVED[  key ] = true;
    pg.sync[ key ] = value;

    return;                                           // console.log( '[CONFIRMED]', value    );
  }

  if ( CACHE[key]  ) return;                          // console.log( '[CACHED]', CACHE[key]  );

  if ( SOLVED[key] ) {

    delete SOLVED[key];

    WATCH.emit('sync', key, value );

    return loop.resume();                             // console.log( '[SOLVED]', SOLVED[key] );
  }

  return true;
}


/**
 *  Check the status of the caches, e.g. they are ready (empty)
 */

function checkCaches(){

  return getKeys(CACHE).length || getKeys(SOLVED).length;
}


/**
 *
 *
 *  @param  {String} remoteID   -
 *  @param  {String} key        -
 *  @param  {String} value      -
 */

function requestSync ( remoteID, key, value ) {

  if ( !config.synchronConfig.naiveSync ) loop.stop();

  var entry = CACHE[key];

  if ( entry != void 0 ) {

    // console.log('[CACHE HIT]');

    value = entry;

  } else {

    // console.log('[CACHE MISS]');

    CACHE[key] = value;
  }

  CONNECTIONS[ remoteID ].send( 'sync', { action: 'confirm', key: key, value: value }, true );
}


/**
 *  Exchange value with remote data & merge on conflict / merge....
 */

function confirmSync ( remoteID, key, value ) { // resync to all

  var entry = CACHE[key];

  entry.results[ PEERS[remoteID].pos ] = value;

  entry.list.length--;

  // TODO: requires responses from all requests or deadlock
  if ( entry.list.length > 0 ) return;

  value = getSyncValue( entry.results );

  MANAGER.broadcast( 'sync', { key: key, value: value }, true );

  sync( key, value, true ); // set local
}


/**
 *  Determine which value should be picked for the resynchronisation.
 *
 *  Compares the frequency and picks the one with most votes,
 *  the position is used as the criteria for priority (regarding a tie).
 *
 *  @param  {[type]} results [description]
 *  @return {[type]}         [description]
 */

function getSyncValue ( results ) {

  if ( config.synchronConfig.naiveSync ) return results[0];


  var serialResults = [],

      frequency     = {},

      entry;

  for ( var i = 0, l = results.length; i < l; i++ ) {

    entry = JSON.stringify( results[i] );

    serialResults.push( entry );

    if ( !frequency[entry] ) frequency[entry] = 0;

    frequency[entry]++;
  }


  var keys  = getKeys( frequency ),

      votes =  0,

      most  = [],

      value;

  for ( i = 0, l = keys.length; i < l; i++ ) {

    entry = keys[i];

    value = frequency[entry];

    if ( value >= votes ) {

      if ( value > votes ) {

        most.length = 0;

        votes = value;
      }

      most.push( entry );
    }
  }


  var priority = serialResults.length;

  for ( i = 0, l = most.length; i < l; i++ ) {

    value = serialResults.indexOf( most[i] );

    if ( value < priority ) priority = value;
  }

  return results[priority];
}


/**
 *  Refreshes the value from another object, writing it directly to the synced data
 *
 *  @param  {Object} obj [description]
 */

function loadSync ( obj ) {

  var keys = getKeys( obj ), prop;

  for ( var i = 0, l = keys.length; i < l; i++ ) {

    prop = keys[i];

    sync( prop, obj[prop], true );
  }
}
