/**
 *  Reactor
 *  =======
 *
 *  A reactive object which notifies its subscribers as properties get changed.
 */


var reactList =  [],   // record of reactors

    SYNC      = 100;   // delay to check the difference of properties


/**
 *  Creates basic object and setup handler
 *
 *  @return {Object}
 */

var getReactor = function() {

  var args = [], obj = Object.create( Object.prototype );

  args.push.apply( args, arguments );

  reactList.push({ reference: {}, callbacks: args });

  checkProperties( reactList.length - 1, obj );

  return obj;
};


/**
 *  Check properties to attach watcher
 *
 *  @param  {Number} id        -
 *  @param  {Object} current   -
 */

function checkProperties ( id, current ) {

  var last    = reactList[id].reference,
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
 *  Determines the differences which properties got removed or added
 *
 *  @param  {Object} last      -
 *  @param  {Object} current   -
 *  @return {Object}
 */

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


/**
 *  Adds getter & setter to a property, which triggers a define callback
 *
 *  @param  {Number} id        -
 *  @param  {Object} current   -
 *  @param  {String} prop      -
 */

function defineProperty ( id, current, prop ) {

  var getter = function() { return reactList[id].reference[ prop ]; },

      setter = function ( value ) {

        // prevent redundancy: old = new
        if ( value === reactList[id].reference[ prop ] ) return;


        if ( typeof value === 'object' ) {

          if ( !Array.isArray(value) ) {

            /**
             *  Method cloaking inspured by @Watch.JS
             *  (see: https://github.com/melanke/Watch.JS )
             */

            var methods = [ 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift' ];

            for ( var i = 0, l = methods.length; i < l; i++ ) setMethod( value, methods[ i ] );

          } else {

            value = extend( getReactor( function ( inner, value ) {

              var result = reactList[id].reference[ prop ];

              result[inner] = value;

              return refer( result );

            }), value );
          }

        }


        refer( value );


        function refer ( value ) {

          reactList[id].reference[ prop ] = value;

          var callbacks = reactList[id].callbacks,

              i, l;

          for ( i = 0, l = callbacks.length; i < l; i++ ) {

            callbacks[i].apply( callbacks[i], [ prop, value ] );
          }

          return value;
        }


        function setMethod( arr, fn ) {

          arr[ fn ] = function(){

            Array.prototype[ fn ].apply( this, arguments );

            return refer( arr );
          };
        }

      };


  // initial call + set diff
  setter( current[prop] );

  Object.defineProperty( current, prop, {

    enumerable  : true,
    configurable: true,
    get         : getter,
    set         : setter
  });
}
