/*jshint devel:true */
/*global pg:true */

(function(){

	'use strict';

	// lobby specific

	// cross browser event
	window.transitionEnd = (function(){

		var prefix = {

				'WebkitTransition'	: 'webkitTransitionEnd',
				'MozTransition'		: 'transitionend',
				'MSTransition'		: 'msTransitionEnd',
				'OTransition'		: 'oTransitionEnd',
				'transition'		: 'transitionEnd'
			},

			temp = document.createElement('div'),
			keys = Object.keys( prefix ),

			i, l; // iterator

		for ( i = 0, l = keys.length; i < l; i++ ) {

			if ( temp.style[ keys[i] ] !== undefined ) return prefix[ keys[i] ];
		}

		console.log('TransitionEnd - is not supported');

	})();


	var form = document.getElementById('form'),
		name = document.getElementById('name');

	form.addEventListener('submit', function ( e ) {	// login for 3rd party authentication

		e.preventDefault();
		e.stopPropagation();


		form.classList.add('fadeOut');
		form.addEventListener( transitionEnd, function(){

			form.removeEventListener( transitionEnd);//
			form.parentNode.removeChild(form);
		});


		// pg.login({ id:  }, function ( name ) {	// name | password || or form, url
		// var name = { value: 'test' };

		var peer = new pg.Peer( name.value );
		// console.log(peer);

		pg.on('connection', function ( channel ) {

			console.log('Connection established !');

			window.send = function( text ){

				channel.send( text );
			};
		});
	});



})();

