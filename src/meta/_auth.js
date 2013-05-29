/**
 *  Auth
 *  ====
 *
 *  Module for handling authentication.
 */

var AUTH = {

  'GITHUB'    : requestGithub,
  'PERSONA'   : requestPersona
  // 'TWITTER',
  // 'GOOGLE'
  // 'FACEBOOK',

};



function requestGithub ( id, callback ) {


}



function requestPersona ( id, callback ) {

  var URL    = 'https://login.persona.org/include.js',

      script = document.createElement('script');


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
