var dir		= process.cwd(),

	path	= dir.substr( 0, dir.lastIndexOf('/') ) + '/test',

	spawn	= require('child_process').spawn,

	testem	= spawn( 'node', [ '../node_modules/.bin/testem' ],  { cwd: path });


testem.on('error', function(err){
	console.log(err);
});

testem.on('close', function(){
	console.log('[tested]');
});
