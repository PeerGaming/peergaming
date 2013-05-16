PeerGaming Server
=================

A brookering service for bootstrapping the initial connections.
Incoming request will be handled and delegated towards WebSockets or Server-Sent Events.

In the future different environments/languages should be supported.

## Plan

Currently looking for a general approach to [work with other projects as well](https://github.com/peers/peerjs/issues/7#issuecomment-14584314).

(a NAT & TURN Server will be available as submodules as well)


The sole usage of the server is:




- subnetting the domain, using seperate rooms

- providing initial handshake / transfer information

- proxy for CORS + OAuth settings

- possibility to offer data as an external API
