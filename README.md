![PeerGaming](https://github.com/Autarc/PeerGaming/raw/master/material/logo-temp.png)

PeerGaming - Share the Fun
==========================

A Client-Side Multiplayer Gaming Framework for the Web.

_Latest Release: 0.2.0 ([changelog](https://github.com/Autarc/PeerGaming/blob/master/HISTORY.md))_


## Introduction

PeerGaming is a web framework for the browser, which uses WebRTC to connect multiple clients
and allows them to communicate. It makes it easy to create & deploy your own Multiplayer game,
as no additional server component is required.

- Site: [peergaming.net](http://peergaming.net)


## Features

* library agnostic (= standalone)
* easy setup / simple connection
* reactive data handling


## Info

The Project is currently still in early development and changes quite often.
Within the next updates, a proper API to be more useful in a gaming environment will be provided.


## Example

```js

var name = 'user';

pg.login( name, function( player ) {

	player.on('connection', function ( peer ) {

		console.log( '[joined]' + peer.name );
	});
});

```


## Usage (API)

TODO


## Structure

* bin		: build script
* deps		: brokering server
* dist		: release
* docs		: documentation
* examples	: lobby & games
* material	: report, assets
* src		: source files
* test		: tests


## Tribute

> In remembrance to all connections which doesn't exist.


## License

Copyright (c) 2013, Stefan Dühring

Distributed under [MIT License](https://github.com/Autarc/PeerGaming/blob/master/LICENSE).
