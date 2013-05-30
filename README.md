![PeerGaming](https://raw.github.com/PeerGaming/thesis/master/raw/logo/pg-logo_v2.png)

PeerGaming - Share the Fun
==========================

A Client-Side Multiplayer Gaming Framework for the Web.

_Latest Release: 0.4.0 ([changelog](https://github.com/PeerGaming/peergaming/blob/master/HISTORY.md))_


## Introduction

PeerGaming is a web framework for the browser, which uses WebRTC to connect multiple clients
and allows them to communicate. It makes it easy to create & deploy your own Multiplayer game,
as no additional server component is required.

- Site: [peergaming.net](http://peergaming.net)


## Support

With the latest Firefox update the DataChannel implementations got changed and broke the API.
Therefore _PeerGaming_ is only running in Chrome 26++ right now. The next version will
provide a proper handling.


## Features

* library agnostic (!= dependency)
* easy setup / automatic connection
* reactive data handling
* serverless hook


## Info

The documentation is still work in progress and will be available later at [docs.peergaming.net](http://docs.peergaming.net) and its [repository](https://github.com/PeerGaming/documentation).


## API - Overview

``` js

  pg.noConflict   : fn  - reset namespace
  pg.VERSION      : obj - refers to the current version
  pg.info         : obj - information about the state
  pg.config       : fn  - configuration for the network
  pg.login        : fn  - set identifier and create player
  pg.player       : obj - own user instance (writeable)
  pg.peers        : obj - list of connected players (readable)
  pg.data         : arr - shortcut to access peers.data + player.data
  pg.sync         : obj - synchronized shared object
  pg.loop         : fn  - synchronized rendering process
  pg.channel      : fn  - handler for a "Channel"
  pg.game         : fn  - handler for a "Game"
  pg.routes       : fn  - define default and custom routes

```


## Quick Guide

- 1.) setup room handler
- 2.) create a new user by login
- 3.) initialize the game
- 4.) use pg.player, pg.data and pg.sync for network synchronization
- *.) define a message handler


## Example

```js

/** [0] Define default route **/

pg.routes('test/42');


/** [1] Setup handler **/

pg.channel( function ( channel ) {

  channel.on( 'enter', function( user ) {

    console.log('[CHANNEL] - enter | User: ' + user.account.name + ' | Channel: ' + channel.id);
  });
});


/** [2] Create a new player **/

el.addEventListener('click', function(){

  pg.login( 'UserName' );
});


/** [3]  Initialize the game **/

pg.game( 'test', function ( game ) {

  game.on( 'enter', function ( user ) {

    console.log('[GAME] - enter | ID: ' + user.id);

    game.start( Game.init );
  });


  game.on( 'leave', function ( peer ) {

    console.log('[GAME] - leave | ID: ' + peer.id);
  });

});


/** [*] Handle messages **/

pg.player.on( 'message', function ( msg ) {

  console.log('[MESSAGE] - ' + JSON.parse(msg).data.msg );
});


```

## Tribute

> In remembrance to all connections which don't exist.


## License

Copyright (c) 2013, Stefan Dühring

Distributed under [MIT License](https://github.com/PeerGaming/peergaming/blob/master/LICENSE).
