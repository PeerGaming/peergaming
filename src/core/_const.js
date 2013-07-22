/**
 *  Constants
 *  =========
 *
 *  Internal references for faster access.
 */


/** global **/

var win     = window,
    doc     = document,
    nav     = win.navigator,
    // loc     = win.location,

    moz     = nav.mozGetUserMedia ? parseFloat( nav.userAgent.match(/Firefox\/([0-9]+)\./).pop()       )
                                  : false,

    chrome  = win.chrome          ? parseFloat( nav.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./).pop() )
                                  : false,

    SESSION = win.sessionStorage,
    LOCAL   = win.localStorage;


/** native **/

var getKeys = Object.keys;


/** internal  **/

var ROOM        = '',        // current room
    QUEUE       = [],        // list to store async function calls
    CONNECTIONS = {},        // datachannel for each peer
    MEDIAS      = {},        // mediastreams for each peer
    SOCKET      = null,      // client-server transport
    MANAGER     = null,      // delegation methods
    INGAME      = false,     // information about the current state
    SERVERLESS  = null,      // optional callback for manual handling
    BACKUP      = {};        // store player data for reconnection


/** references **/

var VERSION     = null,      // pg.VERSION
    INFO        =   {},      // pg.info
    WATCH       = null,      // pg.watch
    PLAYER      =   {},      // pg.player
    PEERS       =   {},      // pg.peers
    DATA        =   [],      // pg.data
    SYNC        = null;      // pg.sync
