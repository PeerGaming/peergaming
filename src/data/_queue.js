/**
 *  Queue
 *  =====
 *
 *  Storing commands on a list - executing them later.
 */

/**
 *  queue
 *
 *  Pushing actions on to a list.
 *  @param  {Function} fn [description]
 *  @return {[type]}      [description]
 */

var Queue = (function(){


  var Queue = function(){

    this.ready  = false;

    this.list   = [];
  };


  /**
   *  add a function to the list
   *  @param {Function} fn [description]
   */

  Queue.prototype.add = function ( fn ) {

    if ( typeof fn === 'function' ) {

      this.list.push( fn );
    }
  };


  /**
   *  Execute the stored functions
   *  @return {[type]} [description]
   */

  Queue.prototype.exec = function() {

    this.ready = true;

    var args = Array.prototype.slice.call( arguments ),

        list = this.list;

    while ( list.length ) list.pop().apply( null, args );
  };


  Queue.prototype.clear = function(){

    this.list.length = 0;
  };

  return Queue;

})();

