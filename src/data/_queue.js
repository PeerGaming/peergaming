/**
 *  Queue
 *  =====
 *
 *  Storing commands on a list for future execution.
 */


/**
 *  Constructor to define the container and initial state
 */

var Queue = function(){

  this.ready  = false;

  this.list   = [];
};


/**
 *  Add functions to the list
 *
 *  @param  {Function} fn   - function to be on the queue
 */

Queue.prototype.add = function ( fn ) {

  if ( typeof fn === 'function' ) {

    this.list.push( fn );
  }
};


/**
 *  Execute stored functions
 */

Queue.prototype.exec = function() {

  this.ready = true;

  var args = Array.prototype.slice.call( arguments ),

      list = this.list;

  while ( list.length ) list.pop().apply( null, args );
};


/**
 *  Empty the list of the queue
 */

Queue.prototype.clear = function(){

  this.list.length = 0;
};
