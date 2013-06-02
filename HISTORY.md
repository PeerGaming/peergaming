## 0.4.3 / 2013-06-02

* Bug Fix: restrict messages to direct connection (see _update_, _sync_)
* Bug Fix: avoid limitations through chaining the connection creations
* add "progress" event for rooms


## 0.4.1 / 2013-06-01

* refactor code:
  - internal references
  - remove queue


## 0.4.0 / 2013-05-30

__Codename: Spicy Phoenix__

* structure order by peer position
* add shared object "pg.sync"
* simple demo for testing


## 0.3.7 / 2013-05-28

* option for serverless hook
* update channel & game with events


## 0.3.4 / 2013-05-24

* include render loop
* imrpove connection handler
* fix ".join" + invalid socket connection


## 0.3.1 / 2013-05-18

* divide into multiple repositories
* improve error handling of socket connection


## 0.3.0 / 2013-05-15

__Codename: Salty Goblin__

* require ".login" to create ".player"
* handle disconnect + scale ".data" references
* server side seperation of rooms


## 0.2.6 / 2013-05-07

* player.data uses a reactive object wrapper
* enable routing via URL & hash
* seperate rooms on client (channel / game)
* add ".noConflict()" to restore a former reference


## 0.2.2 / 2013-04-10

* change intendation
* include test stubs
* firefox compatible


## 0.2.0 / 2013-03-26

* seperate structure & inheritance (e.g. EventEmitter, Peers)
* include stream interface for chunk handling
* remove media request


## 0.1.7 / 2013-03-16

* enable a Peer as a connection Proxy (unreliable)
* differ betweeen XHR and WS
* basic WebSocket server for bootstrapping
* seperate DataChannel + delegate player messages


## 0.1.5 / 2013-03-11

* add server for bootstrapping
* use XHR (SSE) for transport
* implement basic WebRTC handling
* add Peer + Connection Wrapper


## 0.1.2 / 2013-03-04

* add basic feature detection


## 0.1.1 / 2013-01-23

* add event handling


## 0.1.0 / 2013-01-20

* setup basic files
