/**
 *	Detect
 *	======
 *
 *	Checks if the required features are supported by the browser.
 *
 *	ToDo:
 *
 *	- DataChannel
 *	- ServerSent Events/WebSocket
 */

var missing = [];

if ( !window.URL )							missing.push('window.URL - createObjectURL()');
if ( !window.Blob && !window.BlobBuilder )	missing.push('Blob / BlobBuilder');
if ( !window.indexedDB )					missing.push('IndexedDB');
if ( !window.RTCPeerConnection )			missing.push('RTCPeerConnection');
if ( !navigator.getUserMedia )				missing.push('getUserMedia');

if ( missing.length ) {

	alert('Your Browser doesn\'t support the framework :(');
	throw new Error( '\n\n\tMissing support of:\n\n\t' + missing.join('\n\t') );
}
