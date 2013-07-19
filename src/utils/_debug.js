/**
 *  Debug
 *  =====
 *
 *  Debugging calls to help on local development.
 */


/**
 *  Show a counted debug message
 *
 *  @param {String} text   -
 */

function debug ( text ) {

  if ( !PLAYER || !LOCAL.log ) LOCAL.log = 0;

  if ( text[text.length - 1] === '\n' ) {

    text = text.substring( 0, text.length - 1 );
  }

  var num = ++localStorage.log,
      msg = '(' + num + ') - ' + ( (performance.now()) / 1000 ).toFixed(3) + ': ' + text;

  console.log( msg );
}


/**
 *  Resets "debug"-counter
 */

win.clearDebug = function() {

  delete LOCAL.log;
};


/**
 *  General logger to show error messages
 *
 *  @param {Object} err   -
 */

function loggerr ( err )  {

  console.warn('[ERROR] ', err );
  console.warn( err.name + ': ' + err.message );

  WATCH.emit('error', { name: err.name, msg: err.message });
}


/**
 *  Informs if the developer tools are enabled for debugging
 *  (see: https://github.com/adamschwartz/chrome-inspector-detector )
 *
 *  @return {Boolean}
 */

function isDebugging(){

  // firebug
  if ( moz ) return !!console.log;

  // chrome
  var existingProfiles = console.profiles.length;

  console.profile();
  console.profileEnd();

  if ( console.clear ) console.clear();

  return console.profiles.length > existingProfiles;
}


/**
 *  Synchron RPC calls for debugging/testing
 */

win.test = (function() {

  var calls = {

    sync: function ( key, value ) { pg.sync[key] = value; }
  };


  localCheck['test'] = function ( cmd, key, value ) {

    if ( calls[cmd] ) calls[cmd]( key, value );
  };

  return function ( cmd, key, value ) {

    LOCAL['test'] = JSON.stringify([ cmd, key, value ]);

    if ( calls[cmd] ) calls[cmd]( key, value );
  };

})();
