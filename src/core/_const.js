/**
 *  Constants
 *  =========
 *
 *
 */


// global shortcuts

var win = window,

    moz     = !!navigator.mozGetUserMedia,

    SESSION = win.sessionStorage;



// Protocol


// internal variables

var instance,          // Singleton reference

    LOOP_TIME  = 100;  // 100ms      // SYNC_DELAY (dynamcly changed by the manager - regarding connections)


// Error Messages
