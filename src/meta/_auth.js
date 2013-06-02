/**
 *  Auth
 *  ====
 *
 *  Module for handling authentication for external party services.
 */


var AUTH = {

  'GITHUB'    : requestGithub,
  'PERSONA'   : requestPersona
  // 'TWITTER',
  // 'GOOGLE'     // https://github.com/googleplus/gplus-quickstart-javascript
  // 'FACEBOOK',
};


/**
 *  Login on Github
 *
 *  @param  {String}   id         -
 *  @param  {Function} callback   -
 */

function requestGithub ( id, callback ) {

  // TODO: 0.7.0 -> external login
}



/**
 *  Login via BrowserID
 *
 *  @param  {String}   id         -
 *  @param  {Function} callback   -
 */

function requestPersona ( id, callback ) {

  var URL    = 'https://login.persona.org/include.js',

      script = document.createElement('script');


  // TODO: 0.7.0 -> external login

  script.addEventListener( 'load', function(){

    navigator.id.watch({

      loggedInUser: localStorage['user'] || (function(){

        return '';
      })(),

      onlogin: function ( assertion ) {

        console.log(assertion);
      },

      onlogout: function(){

      }

    });


    navigator.id.request();

  });

  script.src = URL;

  document.getElementsByTagName('script')[0].parentNode.insertBefore( script );
}
