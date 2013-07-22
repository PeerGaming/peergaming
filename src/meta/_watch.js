/**
 *  Watch
 *  =====
 *
 *  Global communicator for framework internals (e.g. general public events).
 *
 *  - error
 *  - sync
 *  - message
 *  - media
 *  - permission
 */

WATCH = new Emitter();

var getWatcher = WATCH.on.bind(WATCH);
