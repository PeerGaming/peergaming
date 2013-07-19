/**
 *  Local
 *  =====
 *
 *  Helpers to shared messages to on the local system betweeen different window instances.
 *
 *  - localStorage | storage-event
 *  - shared web worker ( not available in all browsers)
 *  - postMessage (restricted to own windows)
 *
 *  - caveats: currently just in chrome, firefox doesn't support shared web workers yet
 *             (therefore use the fallback with exchanging localStorage + event.listener)
 *
 *
 *  // localStorage[''] = value // works, but can be that nativ method will be overwritten...
 *
 *  - key, setItem, getItem, removeItem, length
 *
 *
 *  - TODO: handle unload ?!
 *
 *  https://developer.mozilla.org/en-US/docs/Mozilla/Gecko/DOM_Storage_implementation_notes?redirectlocale=en-US&redirectslug=DOM%2FStorage%2FImplementation
 */


// event is fired on a change towards the local storage

var localCheck = {};

win.addEventListener('storage', function ( e ) {

  var key   = e.key;
      value = e.newValue,
      ref   = localCheck[key];

  try { value = JSON.parse( value ); } catch ( err ) { console.log(err); }

  if ( !Array.isArray(value) ) value = [ value ];

  if ( typeof ref === 'function' ) ref.apply( ref, value );
});






// as the worker is just for sharing, sync betweeen tabs, the postmessage can be hardcoded !
// var defineBridge = function ( post, response ) {

//   if ( !win.SharedWorker ) return localFallback.apply( null, arguments );


//   // self.onconnect = function(){
//   //
//   // counting...
//   // }

// // 'self.onmessage' + post.toString()
//   post = 'self.onmessage = function ( e ) { postMessage("Worker : " + e.data ); }';
// // .toString()
//   var url = URL.createObjectURL( new Blob([ post ], { type: 'text/javascript' }) );


//   var worker = new SharedWorker(url, 'shared' );//SharedWorker( url );

//   worker.port.onmessage = response;
//   // worker.port.addEventListener('message', response || function ( e ) { console.log( e ); });

//   worker.port.start(); // shared worker needs to be started

//   console.log(worker);

//   // worker.port.addEventListener('connect', function ( e ) {

//   //   var clientPort = e.source;

//   //   console.log(clientPort);

//   //   clientPort.addEventListener('message', function ( e ) {

//   //     var data = e.data;
//   //     console.log('redirecet data ?', data );

//   //     // clientPort.postMessage('worked with data');
//   //   });

//   // });


//   worker.port.addEventListener('error', function ( e ) {

//     throw new Error( e.message + ' (' + e.filename + ':' + e.lineno + ')' );
//   });

//   // worker.port.postMessage('test');

//   return { send: function ( params ) { worker.port.postMessage( params ); } }; // reference for posting input
// };




// function localFallback ( post, response ) {


//   return { send: function(){ } };
// }


// shared worker from inline script ?
// else if not possible - fallback via localstorage eventhandling is the only option...


// shared workers require that both system access the same url -> blobs are unique...



 // <div id="shared_worker_script" style="display:none">
 //     var count = 0;
 //     onconnect = function(e) {
 //       count++;
 //       e.ports[0].postMessage('shared-worker ping: ' + count);
 //     }
 //   </div>

 //     url = getBlobForScript('shared_worker_script');
 //     log("shared url: " + url);
 //     var sw = new SharedWorker(url, 'shared');
 //     sw.port.onmessage = function(event) {
 //       log("Received: " + event.data);
 //     }

 //     function getBlobForScript(id) {
 //       // var bb = new BlobBuilder();
 //       // bb.append(document.getElementById(id).innerText);
 //       var blob = new Blob([document.getElementById(id).innerText ])
 //       return window.webkitURL.createObjectURL(blob);
 //     }
