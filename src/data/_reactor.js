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


var list = [],    // record of reactors

    SYNC = 100;   // delay for exchange - getter/setter


/**
 *  [getReactor description] can use multiple callbacks
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

  setTimeout( checkProperties, SYNC, id, current );
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

    if ( current[ lastKeys[i] ] == void 0 ) remove.push( lastKeys[i] );
  }

  for ( i = 0, l = currentKeys.length; i < l; i++ ) {

    if ( last[ currentKeys[i] ] == void 0 ) add.push( currentKeys[i] );
  }

  return { add: add, remove: remove };
}

// - array & object dont geta new value set, but the lengths of their keys can be changed !

// TODO:
// - still problem with object 'delete' won't trigger as the setter - no new value send !
// - array.lenght, -1 || clearing an array wont triggger !
// - no functions can be shared ! -> for handling logic, better use RPC and the custom channel
// - deep nesting for complex sync

/**
 *  [defineProperty description]
 *  @param  {[type]} id      [description]
 *  @param  {[type]} current [description]
 *  @param  {[type]} prop    [description]
 *  @return {[type]}         [description]
 */

function defineProperty ( id, current, prop ) {

  var getter = function() { return list[id].reference[ prop ]; }, // set array ! change it

      setter = function ( value ) {

        // prevent redundancy: old = new
        if ( value === list[id].reference[ prop ] ) return;


        if ( typeof value === 'object' ) {

          // Array
          if ( !Array.isArray(value) ) {

            // method cloaking: @WatchJS |https://github.com/melanke/Watch.JS/blob/master/src/watch.js
            var methods = [ 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift' ];

            for ( var i = 0, l = methods.length; i < l; i++ ) setMethod( value, methods[ i ] );

          } else { // Object

            value = utils.extend( getReactor( function ( inner, value ) {

              var result = list[id].reference[ prop ];

              result[inner] = value;

              return refer( result );

            }), value );
          }

        }


        refer( value );


        function refer ( value ) {

          list[id].reference[ prop ] = value;

          var callbacks = list[id].callbacks,

              i, l;

          for ( i = 0, l = callbacks.length; i < l; i++ ) {

            callbacks[i].apply( callbacks[i], [ prop, value ] );
          }

          return value;
        }


        // call protype then - and trigger the callback !
        function setMethod( arr, fn ) {

          arr[ fn ] = function(){

            Array.prototype[ fn ].apply( this, arguments );

            return refer( arr );
          };
        }

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
