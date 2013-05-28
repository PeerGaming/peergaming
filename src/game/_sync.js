/**
 *  Sync
 *  ====
 *
 *  A synchronized shared object - which is accessible by all peers.
 */

pg.sync = getReactor( sync );


// local cache
var CACHE = {};

// delegate handling
var METHODS = {

  'NUMBER': pick,
  'STRING': pick,
  'ARRAY' : merge
  // object ?
};

// as the initial value will be used -> remove something etc., should work right away...


// informing other peers about your value set
function sync ( key, value ) {

  if ( CACHE[key] ) return console.log( '[CACHE] ' , CACHE[key] );

  var ids = Object.keys( CONNECTIONS );

  CACHE[key] = { list: ids, results: {} };

  CACHE[key].results[ INSTANCE.id ] = value;

  for ( var i = 0, l = ids.length; i < l; i++ ) {

    CONNECTIONS[ ids[i] ].send( 'sync', { key: key, value: value });
  }

}

function resync ( remoteID, key, value ) {

  verify();

  function verify(){

    if ( !CACHE[key] ) return setTimeout( verify, LATENCY[ remoteID ] );

    var entry = CACHE[key];

    entry.list.length -= 1;

    entry.results[ remoteID ] = value;

    if ( entry.list.length ) return;

    // logic for determine the result
    var result = METHODS[ utils.check(value).toUpperCase() ]( entry.results );

    pg.sync[ key ] = result;

    delete CACHE[key];
  }
}


// other one was faster ...
// if ( CACHE[key] ) return console.log( '[CACHE] ', key, CACHE[key].value ); //  }{ pg.sync[key] = CACHE[key].value; return console.log( '[CACHE] ', key, CACHE[key].value ); }

// both ar equal - non got set in the cache... -> send both the requests



// solves a structure of key-value pairs,
// key: id - value: result, by return the result with the lowest ID hash
function pick ( map ) {

  return map[ Object.keys( map ).sort( order )[0] ];
}


function merge ( map ) {

  return Object.keys( map ).sort( order ).map( function ( id ) { return map[id]; }).reduce( combine );
}

// order entries by lower ID hash
function order ( curr, next )   { return utils.getHash(next) - utils.getHash(curr); }

function combine ( curr, next ) { return curr.concat(next); }
