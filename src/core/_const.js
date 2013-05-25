/**
 *  Constants
 *  =========
 *
 *
 */


// global shortcuts

var win     = window,

    moz     = !!win.navigator.mozGetUserMedia,

    chrome  = !!win.chrome,

    SESSION = win.sessionStorage;



// Protocol


// internal variables - capital letters

var INSTANCE,         // pg.player

    INFO,             // pg.info

    CONNECTIONS = {}, // internal variable for accessing

    LOOP_TIME = 100;  // 100ms      // SYNC_DELAY (dynamcly changed by the manager - regarding connections)

// Error Messages
