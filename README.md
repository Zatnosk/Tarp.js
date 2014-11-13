Tarp.js
======
Tarp.js is a fully clientside JavaScript library for the Tent protocol implementing v0.3. It is currently in alpha stage. For help with this library contact ^zatnosk.cupcake.is via Tent status posts.

Tarp.js uses promises. It also depends on hawk.js (supplied in this repo).

Because it is a clientside library, it is dependent on some help to discover entities. For this purpose I've written a simple discovery service in PHP: [tarp-discover](https://github.com/Zatnosk/tarp-discover).

API
---
`tarp = Tarp()` :: No arguments -> Initialises Tarp and gives access to the API.

`server = tarp.get_server(entity_uri)` :: A valid entity URI -> a possibly new connection to a server.

`server = tarp.get_active_entity()` :: No arguments -> a connection to a server of the active entity.

`tarp.store()` :: no arguments -> Saves state to session & local storage.

`tarp.dump()` :: no arguments -> For debugging Tarp.js

`server.posts_feed(parameters)` :: ... -> a promise of the servers feed.

`server.new_post(content)` :: A valid raw post -> ...

`server.get_post(content, parameters)` :: A valid existing post -> ... -> ...

`server.get_post_mentions(content, parameters)` :: A valid existing post -> ... -> ...

`server.get_post_versions(content, parameters)` :: A valid existing post -> ... -> ...

`server.get_post_children(content, parameters)` :: A valid existing post -> ... -> ...

`server.put_post(content)` :: A valid edited post -> ...

`server.delete_post(content)` :: A valid existing post -> ...
