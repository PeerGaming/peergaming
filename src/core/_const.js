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
    LOCAL   = win.localStorage;


/** internal  **/

var ROOM        = '',        // current room
    QUEUE       = [],        // list to store async function calls
    CONNECTIONS = {},        // datachannel for each peer
    MEDIAS      = {};        // mediastreams for each peer
    SOCKET      = null,      // Client-Server Transport
    MANAGER     = null;      //


/** references **/

var VERSION     = null,      // pg.VERSION
    INFO        =   {},      // pg.info
    PLAYER      = null,      // pg.player
    PEERS       =   {},      // pg.peers
    DATA        =   [],      // pg.data
    SYNC        = null;      // pg.sync
