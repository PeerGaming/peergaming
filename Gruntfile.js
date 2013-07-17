/** Grunt shortcut for running the custom build script **/

module.exports = function ( grunt ) {

  grunt.registerTask('default', function(){

    require('child_process').spawn('node' , [ process.cwd() + '/bin/build.js' ]);
  });
};
