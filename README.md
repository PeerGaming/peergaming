![PeerGaming](https://raw.github.com/PeerGaming/thesis/master/raw/logo/pg-logo_v2.png)

PeerGaming - Share the Fun
==========================

A Client-Side Multiplayer Gaming Framework for the Web.

_Latest Release: 0.3.1 ([changelog](https://github.com/PeerGaming/peergaming/blob/master/HISTORY.md))_


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

pg.channel( function ( channel ) {

  channel.on( 'enter', function( user ) {

    console.log( '[entered] User: ' + user.account.name + ' - Channel: ' + channel.id  + ' ]');
  });

});

pg.login( 'test' );

```


## Tribute

> In remembrance to all connections which don't exist.


## License

Copyright (c) 2013, Stefan Dühring

Distributed under [MIT License](https://github.com/PeerGaming/peergaming/blob/master/LICENSE).
