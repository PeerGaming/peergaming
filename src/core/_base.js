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

VERSION = {

  codeName    : 'spicy-phoenix',
  full        : '0.5.0',
  major       : 0,
  minor       : 5,
  dot         : 0
};


/**
 *  Restore and provide the last reference for the namespace "pg"
 *
 *  @return {Object}
 */

function noConflict(){

  context.pg = reservedReference;

  return this;
}
