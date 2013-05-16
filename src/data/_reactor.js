/**
 *  Reactor
 *  =======
 *
 *  An "reactive" object, which notifies it's subscribers as properties got changed.
 *
 *  ToDo:
 *
 *  - check if multiple reactors receive different IDs and are therefore seperated
 */


// record of reactors
var list = [];


/**
 *  [getReactor description]
 *  @return {[type]} [description]
 */

var getReactor = function() {

  var args = [], obj = Object.create( Object.prototype );

  args.push.apply( args, arguments );

  list.push({ reference: {}, callbacks: args });

  checkProperties( list.length - 1, obj );

  return obj;
};



/**
 *  [checkProperties description]
 *
 *  @param  {[type]} id      [description]
 *  @param  {[type]} current [description]
 *  @return {[type]}         [description]
 */

function checkProperties ( id, current ) {

  var last    = list[id].reference,
      diff    = getDifferences( last, current ),

      add     = diff.add,
      remove  = diff.remove,

      i, l;


  // add - watching | unwatch - remove
  if ( add.length || remove.length ) {

    for ( i = 0, l = add.length; i < l; i++ ) defineProperty( id, current, add[i] );

    for ( i = 0, l = remove.length; i < l; i++ ) delete last[ remove[i] ];
  }

  setTimeout( checkProperties, LOOP_TIME, id, current );
}


/**
 *  [getDifferences description]
 *  @param  {[type]} last    [description]
 *  @param  {[type]} current [description]
 *  @return {[type]}         [description]
 */

var getKeys = Object.keys;

function getDifferences ( last, current ) {

  var lastKeys    = getKeys( last ),
      currentKeys = getKeys( current ),

      add         = [],
      remove      = [],

      i, l;

  for ( i = 0, l = lastKeys.length; i < l; i++ ) {

    if ( !current[ lastKeys[i] ] ) remove.push( lastKeys[i] );
  }

  for ( i = 0, l = currentKeys.length; i < l; i++ ) {

    if ( !last[ currentKeys[i] ] ) add.push( currentKeys[i] );
  }

  return { add: add, remove: remove };
}



/**
 *  [defineProperty description]
 *  @param  {[type]} id      [description]
 *  @param  {[type]} current [description]
 *  @param  {[type]} prop    [description]
 *  @return {[type]}         [description]
 */

function defineProperty ( id, current, prop ) {

  var getter = function() { return list[id].reference[ prop ]; },

      setter = function ( value ) {

        // change in the reference model as well
        list[id].reference[ prop ] = value;

        var callbacks = list[id].callbacks,

            i, l;

        for ( i = 0, l = callbacks.length; i < l; i++ ) {

          callbacks[i].apply( callbacks[i], [ prop, value ] );
        }

        return value;
      };


  // initial call + set diff
  setter( current[prop] );


  // setup watcher
  Object.defineProperty( current, prop, {

    enumerable  : true,
    configurable: true,
    get         : getter,
    set         : setter
  });

}
