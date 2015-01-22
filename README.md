Tarp.js
=======
Tarp.js is a JavaScript library for the Tent protocol implementing v0.3. It is currently in alpha stage. For help with this library contact ^zatnosk.cupcake.is via Tent status posts.

Tarp.js is primarily created for clientside use in browsers, although there is some support for Node, CommonJS and AMD.

Tarp.js uses promises, so a polyfill might be necessary if used in older browsers.
It also depends on [hawk.js](https://github.com/hueniverse/hawk) (supplied in this repo).

Because it is primarily a clientside library, it is dependent on some help to discover entities. For this purpose I've written a simple discovery service in PHP: [tarp-discover](https://github.com/Zatnosk/tarp-discover).
An internal discovery service will be added at a later point for use in server-side contexts.

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

Tarp as a Module
----------------
Tarp can be used as a module in Node, CommonJS implementations, or AMD implementations.

### Including in a Node app
To include Tarp in a Node app, use

```JavaScript
var tarp = require('./path/to/tarp.js'); //Initialize; .js not required

server = tarp.get_server(https:\/\/example.cupcake.is);
...
```


### Including in a CommonJS app

To include Tarp in a CommonJS app, use

```JavaScript
var tarp = require('./path/to/tarp.js'); //Initialize; .js not required

server = tarp.get_server(https:\/\/example.cupcake.is);
...
```
