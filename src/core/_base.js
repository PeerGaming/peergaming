/**
 *  Base
 *  ====
 *
 *  Basic wrapper definition.
 */

var reservedReference = context.pg,

    pg = Object.create( null );

/**
 *  [VERSION description]
 *
 *  Information about the framework version.
 *  @type {Object}
 */

pg.VERSION = {

  codeName    : 'salty-goblin',
  full        : '0.3.7',
  major       : 0,
  minor       : 3,
  dot         : 7
};



/**
 *  [noConflict description]
 *
 *  Restore and provide the last reference of the namespace 'pg'.
 *  @return {[type]} [description]
 */

pg.noConflict = function(){

  context.pg = reservedReference;

  return this;
};
