/**
 *	Base
 *	====
 *
 *	Basic wrapper definitions.
 */

var pg = function(){};

pg.VERSION = '0.2.0';


// Collection of all connected peers
pg.peers = {};


var READY_STATES = {

	0: 'connecting',
	1: 'open',
	2: 'closing',
	3: 'closed'
};


// internal variables

var instance;				// Singleton reference
