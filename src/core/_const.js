/**
 *  Constants
 *  =========
 *
 *  Internal references for faster access.
 */


/** global **/

var win     = window,

    doc     = document,

    moz     = !!win.navigator.mozGetUserMedia,

    chrome  = !!win.chrome,

    SESSION = win.sessionStorage,

    LOCAL   = win.localStorage,

    rand    = Math.random;


/** internal  **/

var INSTANCE    = null,   // pg.player

    PEERS       = null,   // pg.peers

    INFO        = null,   // pg.info

    ROOM        = null,   // current room

    CONNECTIONS =   {},   // datachannel for each peer

    MEDIAS      =   {};   // mediastreams for each peer
