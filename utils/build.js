#!/usr/bin/env node

/*global node, require, console, process */

/*
	A custom build script to concatinate multiple files in
	a declarative way (inspired by Sprockets).

	Following additional parameters are possible:

	-w || --watch	: watch files for changes
	-h || --hint	: hint for common mistakes
	-m || --min		: creates an additional minified version
	-t || --test	: running the tests

	-d || --dev		: enable all flags
*/


/* default settings */

var config = {

	src		: '/src',
	dist	: '/dist',
	specs	: '/test',
	watch	: false,
	hint	: false,
	test	: false,
	min		: true
};

/* input */
var flags = process.argv.slice(2);

for ( var i = 0, l = flags.length; i < l; i++ ) {

	if ( flags[i] === '--watch'	|| flags[i] === '-w' ) config.watch	= true;
	if ( flags[i] === '--hint'	|| flags[i] === '-h' ) config.hint	= true;
	if ( flags[i] === '--test'	|| flags[i] === '-t' ) config.test	= true;
	if ( flags[i] === '--min'	|| flags[i] === '-m' ) config.min	= true;

	if ( flags[i] === '--dev' || flags[i] === '-d' ) {

		config.watch	= true;
		config.hint		= true;
		config.test		= true;
		config.min		= false;
	}
}



/* requirements */
var jshint, UglifyJS, mocha, chai;

// linting through jshint
if ( config.hint ) {

	try { jshint = require('jshint');	} catch ( err ) {

		if ( err.code === 'MODULE_NOT_FOUND' ) {

			// console.log('[Error] Missing Module "jshint"\t- to install: npm -g install jshint');
		}
	}
}

// using uglify for minification
if ( config.min ) {

	try { UglifyJS = require('uglify-js');	} catch ( err ) {

		if ( err.code === 'MODULE_NOT_FOUND' ) {

			// console.log('[Error] Missing Module "uglify-js"\t- to install: npm -g install uglify-js');
		}
	}
}

// running tests via mocha + chai
if ( config.test ) {

	try { mocha = require('mocha'); } catch ( err ) {

		if ( err.code === 'MODULE_NOT_FOUND' ) {

			// console.log('[Error] Missing Module "mocha"\t- to install: npm -g install mocha');
		}
	}

	try { chai = require('chai'); } catch ( err ) {

		if ( err.code === 'MODULE_NOT_FOUND' ) {

			// console.log('[Error] Missing Module "chai"\t- to install: npm -g install chai');
		}
	}
}



/* process */
(function(){

	'use strict';

	var fs = require('fs');

	var cwd = process.cwd(), root = cwd.substr( 0, cwd.lastIndexOf('/') ),

		info, code;

	init();

	var directories, pending, keys, parsing, cache;

	function init(){

		directories = {};
		pending = 1;
		keys = [];
		parsing = 0;
		cache = {};

		fs.readdir( root, function ( err, files ) {

			if ( err ) throw err;

			if ( !info ) {

				for ( var i = 0, l = files.length; i < l; i++ ) {

					if ( files[i].match('(P|p)ackage.json') ) {

						getPackage( root +'/' + files[i] );
						return;
					}
				}
			}

			readDir( root + config.src );
		});
	}


	function getPackage ( path ) {

		fs.readFile( path, 'utf8', function ( err, data ) {

			if ( err ) throw err;

			info = JSON.parse( data );

			readDir( root + config.src );
		});
	}


	function readDir ( path ) {

		var current = path.substr( root.length );

		directories[current] = {};

		fs.readdir( path, function ( err, files ) {

			if ( err ) throw err;

			pending += files.length - 1; // see init, check

			for ( var i = 0, l = files.length; i < l; i++ ) getStats( path, current, files[i] );
		});
	}


	function getStats ( path, current, file ) {

		path = path + '/' + file;

		fs.stat( path, function ( err, stats ) {

			if ( err ) throw err;

			if ( stats.isDirectory() ) {

				readDir( path );

			} else if ( stats.isFile() ) {

				pending--;

				directories[current][ file ] = path;
			}

			if ( !pending ) readFiles( config.src );
		});
	}


	function readFiles ( key, replace ) {

		var file = directories[ key ],

			keys = Object.keys( file );

		for ( var i = 0, l = keys.length; i < l; i++ ) {

			fs.readFile( file[ keys[i] ], 'utf8', replace || parse ); // reusage
		}
	}


	var DIRECTIVE_PATTERN = /^\W*=\s*require\s*(.*?)$/gm;

	function parse ( err, data ) {

		if ( err ) throw err;

		// ToDo: improve regex for verbosity-> later more like sprockets: ./data or "./as"
		code = data.replace( DIRECTIVE_PATTERN, function ( match, text ) {

			if ( cache[text] ) return cache[text];

			keys.push( text ); return match;
		});

		if ( keys.length && code === data ) {

			for ( var i = 0, l = keys.length; i < l; i++ ) reserve( keys[i] );

		} else { write( code );	}
	}


	function reserve ( key ) {

		parsing++;

		cache[key] = '';

		readFiles( config.src + '/' + key, function ( err, data ) {

			if ( err ) throw err;

			cache[key] += data;

			if ( !--parsing ) readFiles( config.src );
		});
	}


	function write ( text ) {

		var fileName = '/';

		if ( info ) {

			if ( info.name ) fileName += info.name.toLowerCase();
			if ( info.version ) fileName += '-' + info.version;

		} else { fileName += 'bundled';	}

		fs.writeFile( root + config.dist + fileName +'.js', text, 'utf8', function ( err ) {

			if ( err ) throw err;

			check();

			if ( !config.watch ) return;


			// set watching
			config.watch = null;

			console.log('\n\t\t:: Watching ::\n');

			var watch = fs.watch || fs.watchFile,

				dirNames = Object.keys( directories ),

				name,	// temp

				i, l;	// iterator

			for ( i = 0, l = dirNames.length; i < l; i++ ) {

				name = root + dirNames[i];

				fs.unwatchFile( name );
				watch( name, cycle );
			}

		});
	}


	// workaround unstable API
	var changed = false;

	function cycle ( event, filename ) {

		changed = !changed;

		if  ( changed === false ) return;

		var date = new Date();

		console.log('[ ' + date.getFullYear() + '-' + date.getMonth()+1 + '-' + date.getDate() + ' | ' +
							date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ] ' +
							event + 'd "' + filename  + '"' );
		init();
	}


	function check(){

		// if ( config.hint && jshint ) {
		//	console.log('hinting');
		// }

		// if ( config.min && UglifyJS ) {
		//	console.log('minify');
		// }

		// if ( config.test && mocha ) {
		//	console.log('test');
		// }
	}

})();
