/**
 *	Adapter:
 *
 *	Normalize different browser behavior
 */

if ( !window.URL ) {

	window.URL = window.webkitURL || window.msURL || window.oURL;
}

if ( !window.BlobBuilder ) {

	window.BlobBuilder =	window.BlobBuilder || window.WebKitBlobBuilder ||
							window.MozBlobBuilder || window.MSBlobBuilder ||
							window.OBlobBuilder;
}

if ( !window.indexedDB ) {

	if ( window.mozIndexedDB ) {

		window.indexedDB = window.mozIndexedDB;

	} else if ( window.webkitIndexedDB ) {

		window.indexedDB =  window.webkitIndexedDB;

		IDBCursor = webkitIDBCursor;
		IDBDatabaseException = webkitIDBDatabaseException;
		IDBRequest = webkitIDBRequest;
		IDBKeyRange = webkitIDBKeyRange;
		IDBTransaction = webkitIDBTransaction;

	} else {

		throw new Error('IndexedDB is currently not supported by your browser.');
	}
}

if ( !window.indexedDB.deleteDatabase ) {

	throw new Error('IndexedDB is currently not supported by your browser.');
}
