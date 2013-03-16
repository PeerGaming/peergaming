/**
 *  Misc
 *  ====
 *
 *  Collection of simple helpers.
 */


var utils = {};


/**
 *	Extends properties of an Object.
 *
 *	@param  {[type]} target [description]
 *	@return {[type]}        [description]
 */

utils.extend = function extend ( target ) {

	var source, key;

	for ( var i = 1, length = arguments.length; i < length; i++ ) {

		source = arguments[i];

		for ( key in source ) if ( source.hasOwnProperty(key) ) target[key] = source[key];
	}

	return target;
};


// ToDo: inheritage - extending protype, e.g. player gets init of peer
utils.inherits = function inherits ( child, parent ) {

	child.prototype = Object.create( parent.prototype );
};



// see @broofa:
// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523

// ToDo: Use a timestemp for ID calculation ?

utils.createUID = function createUID(){

	var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});

	return id;
};
