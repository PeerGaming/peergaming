/**
 *  Debug
 *  =====
 *
 *  Debugging calls for development.
 */


/**
 *  log
 *
 *  Log information - display the text in a structured manner !
 *  @return {[type]} [description]
 */

function debug ( text ) {

	if ( !INSTANCE || !localStorage.log ) {

		localStorage.log = 0;
	}

	if ( text[text.length - 1] === '\n' ) {

		text = text.substring( 0, text.length - 1 );
	}

	var num = ++localStorage.log,
		msg = '(' + num + ') - ' + ( (performance.now()) / 1000 ).toFixed(3) + ': ' + text;

	console.log( msg );
}

win.clearDebug = function() {

	delete localStorage.log;
};


/**
 *  logger
 *
 *  Logging errors
 *  @param  {[type]} err [description]
 *  @return {[type]}     [description]
 */
function loggerr ( err )  {

	console.log('[error] ', err );
  console.log( err.name + ': ' + err.message );
}


/**
 *  Check debugging state
 *
 *	See https://github.com/adamschwartz/chrome-inspector-detector and
 *  http://stackoverflow.com/questions/7527442/how-to-detect-chrome-inspect-element-is-running-or-not/15567735#15567735
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


// extend profiler - http://smnh.me/javascript-profiler/


// stopbefore

// https://gist.github.com/NV/5376464

// copy(JSON.stringify(data, null, 2))
