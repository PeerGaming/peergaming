/**
 *  Constants
 *  =========
 *
 *
 */


// global shortcuts

var win     = window,

    doc     = document,

    moz     = !!win.navigator.mozGetUserMedia,

    chrome  = !!win.chrome,

    SESSION = win.sessionStorage,

    rand    = Math.random;


// internal variables - references

var INSTANCE    = null,   // pg.player

    INFO        = null,   // pg.info

    ROOM        = null,   // current room

    CONNECTIONS =   {},   // datachannel to peers

    MEDIAS      =   {};   // mediastream to peers
