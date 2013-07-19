/**
 *  Watch
 *  =====
 *
 *  Global communicator for framework internals (e.g. general public events).
 *
 *  - error
 *  - sync
 */

WATCH = new Emitter();

var getWatcher = WATCH.on.bind(WATCH);
