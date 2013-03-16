
// ToDo: check with resending + intevals ?


// timer stored on the front as well !
// if ( buffer[id] && buffer[id].timer ) {

//	clearInterval( buffer[id].timer );
// }

// if ( msg.clear ) {	// end PC1

//	delete buffer[id];
//	return;
// }


// if ( msg.part && !msg.data ) {					// sending chunk

//	part = msg.part;

//	console.log('[send chunk] - || ' + part );

//	timer = setInterval(function(){

//		channel.send( JSON.stringify({ id: id, data: buffer[id].chunks[part], part: part }) );

//	}, config.channelConfig.CHUNK_TIMER );

//	buffer[id].timer = timer;

//	channel.send( JSON.stringify({ id: id, data: buffer[id].chunks[part], part: part }) );//buffer[id].pop() }) );

//	return;
// }


// if ( !buffer[id] ) {								// first declaration || new chunks

//	console.log( '[new chunk] - || ' + msg.size );

//	buffer[id] = { size: msg.size, timer: null, chunks: [] };



//	part = buffer[id].chunks.length;

//	console.log('[request chunk] - || ' + part );


//	timer = setInterval(function(){

//		channel.send( JSON.stringify({ id: id, part: part }) );

//	}, config.channelConfig.CHUNK_TIMER );

//	buffer[id].timer = timer;


//	channel.send( JSON.stringify({ id: id, part: part }) );

//	return;
// }


// console.log(msg.part, buffer[id].chunks.length, buffer[id].chunks );


// // previous one
// if ( msg.part < buffer[id].chunks.length ) return;


// buffer[id].chunks[ msg.part ] = msg.data;


// // request
// if ( buffer[id].chunks.length !== buffer[id].size ) {

//	part = buffer[id].chunks.length;

//	console.log('[request chunk] - || ' + part );

//	timer = setInterval(function(){

//		channel.send( JSON.stringify({ id: id, part: part }) );

//	}, config.channelConfig.CHUNK_TIMER );

//	buffer[id].timer = timer;

//	channel.send( JSON.stringify({ id: id, part: part }) );

// // build
// } else {

//	channel.send( JSON.stringify({ id: id, clear: true }) );


//	console.log('[build chunk]');

//	msg = JSON.parse( buffer[id].chunks.join('')  );

//	delete buffer[id];

//	console.log(msg);
//	// return;

//	if ( customHandlers[msg.action] ) {

//		customHandlers[msg.action]( msg.data );

//	} else {

//		defaultHandlers.register({ data: JSON.stringify(msg) });
//	}
// }
