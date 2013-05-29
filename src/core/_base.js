/**
 *  Base
 *  ====
 *
 *  Framework foundations.
 */


var reservedReference = context.pg,

    pg = Object.create( null );


/**
 *  Information about the current version
 *
 *  @type {Object}
 */

pg.VERSION = {

  codeName    : 'spicy-phoenix',
  full        : '0.4.0',
  major       : 0,
  minor       : 4,
  dot         : 0
};


/**
 *  Restore and provide the last reference for the namespace "pg"
 *
 *  @return {Object}
 */

pg.noConflict = function(){

  context.pg = reservedReference;

  return this;
};
