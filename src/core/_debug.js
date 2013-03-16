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

	if ( !instance || !localStorage.log ) {

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

	console.log('[error]');
	console.log( err , err.name + ': ' + err.message );
}

