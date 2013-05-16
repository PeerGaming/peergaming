PeerGaming API
==============

All properties are accessible under the namespace of _pg_.


## Index

* [Version](#version)
* [Info](#info)
* [Config](#config)
* [Routes](#routes)
* [Login](#login)
* [Player](#player)
* [Peers](#peers)
* [Data](#data)
* [Channel](#channel)
* [Game](#game)
* [Loop](#loop)

***

## Version

**pg.VERSION** (_::string_)													|| Method, Type

Showing the version of framework. Current relase got 0.2.2.					|| Description. Return

Usage:																		|| Usage, paramter
```console.log( pg.VERSION )   // 0.2.2```


## Info

**pg.info** (_::object_)

Showing network information.

Properties:

	-
	- duration - {number} -
	-

Usage:
```console.log( pg.info.duration )		//



## Config

**pg.config( [ <object> customConfig ] )** (_::function::_)

Overwrites the defaults settings with custom configurations. Returns the current object.

Properties:

	- channelConfig:
		- BANDWIDTH
		- MAX_BYTES
		- CHUNK_SIZE

	- socketConfig:
		- server

	- peerConfig
		- iceServers			|| Stun, Turn ?

	- connectionConstraints
		- optional

	- mediaConstraints
		- mandatory
		- optional


## Routes

**pg.routes([ <object> customRoutes ])** (_::function_)

Overwrites the default routes with custom configurations. Returns the current routing mapping.

Matches the URL routes & hashes to internal callbacks to execute.




## Login

**pg.login(function( <Player> player ))** (_::function_)



## Player

**pg.player** (_::object_)


## Peers

**pg.peers** (_::array_)


## Data

**pg.data** (_::array_)


## Channel

**pg.channel( <string> id, function( <Channel> channel ))** (_::function_)


## Game

**pg.game( <string> id, function( <Game> game ))** (_::function_)


## Loop

**pg.loop(function( <number> delta ))** (_::function_)
