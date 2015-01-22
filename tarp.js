(function (root, tarp){
	/*
	 * Build system support inspired by:
	 * http://ifandelse.com/its-not-hard-making-your-library-support-amd-and-commonjs/
	 */
	if(typeof define === 'function' && define.amd){
		// AMD API detected
		define('tarp', ['hawk'], function(hawk){return {'Tarp': tarp(hawk)}})
	} else if(typeof module === 'object' && module.exports){
		// Looks like node.js variant of CommonJS
		var hawk = require('hawk')
		module.exports.Tarp = tarp(hawk)
	} else if(typeof exports === 'object' && exports){
		// Looks like CommonJS
		var hawk = require('hawk')
		exports.Tarp = tarp(hawk)
	} else if(root.hawk){
		root.Tarp = tarp(root.hawk)
	} else {
		console.error('ERROR: Tarp is not available; could not find dependency: [Hawk](https://github.com/hueniverse/hawk).')
	}
}(this, function(hawk){
/*
 * Hattop is a small module for HTTP requests
 * used by Tarp and therefore included here.
 */
var Hattop = (function Hattop(){
	var parseHeaders = function(headerString){
		var headers = headerString.split("\x0A")
		var headerObj = {}
		for(i in headers){
			var colon = headers[i].indexOf(':')
			var key = headers[i].substring(0,colon).trim()
			var value = headers[i].substring(colon+1).trim()
			headerObj[key] = value
		}
		return headerObj;
	}

	function HTTPRequest(method, uri, headers, body){
		this.method = method
		this.uri = uri
		this.headers = headers
		this.body = body
	}

	HTTPRequest.prototype.hawk = function(id, key, client_id){
		var options = {
			'credentials': {
				'id': id,
				'key': key,
				'algorithm': 'sha256'
			},
			'app': client_id,
		}
		if(this.body){
			options.payload = this.body
			options.contentType = this.headers['Content-Type']
		}
		var hawkheader = hawk.client.header(this.uri, this.method, options)
		this.headers.Authorization = hawkheader.field
	}

	HTTPRequest.prototype.send = function(){
		var req = this
		return new Promise(function(resolve, reject){
			var xhr = new XMLHttpRequest()
			xhr.open(req.method, req.uri, true)
			if(req.headers){
				for(header in req.headers){
					xhr.setRequestHeader(header, req.headers[header])
				}
			}

			xhr.onload = function(){
				if(xhr.status == 200){
					var response = {
						"headers": parseHeaders(xhr.getAllResponseHeaders()),
						"body": xhr.responseText
					}
					resolve(response)
				} else {
					console.log(xhr)
					reject(Error(xhr.statusText+' \nURI: '+req.uri))
				}
			}

			xhr.onerror = function(){
				reject(Error('Network Error'))
			}

			console.log(req.uri, xhr)
			if(req.body){
				xhr.send(req.body)
			} else {
				xhr.send()
			}
		})
	}

	return {
		'createRequest': function(method, uri, headers, body){
			return new HTTPRequest(method, uri, headers, body)
		}
	}
})()

function Tarp(app_data){
	function Server(entity){
		this.entity = entity
		/*
		NOTE: It might be a security hole to allow access to the entity data this way
		I don't know if it is a plausible attact vector
		*/
		//this.entity.uri = entity_uri
	}

	var data = {
		'app_data': app_data,
		'servers': {},
		'active_entity': null
	}

	var action_queue = new Promise(function(resolve,reject){resolve()})

	function queue(obj){
		action_queue = action_queue.then(function(){return obj})
		return action_queue
	}

	function init(){
		data.app_data = app_data
		queue(load())
		queue(catch_redirect())
		/*
		Note to self: START HERE!!
		Test the get-functions
		Implement attachment support
		Decide on error handling
		*/
		var tarp = {
			'get_server': get_server,
			'get_active_entity': get_active_entity,
			'get_known_entities': get_known_entities,
			'dump': function(){console.log('dump:',data);return data},
			'store': store
		}
		return tarp
	}

	Server.prototype.posts_feed = function posts_feed(parameters){
		var entity_uri = this.entity.uri
		var posts_feed_endpoint = this.entity.endpoints.posts_feed
		return new Promise(function(resolve, reject){
			if(!isEntityConnected(entity_uri)) reject(Error('"'+entity_uri+'" is not connected.'))
			var request = Hattop.createRequest(
				'GET',
				posts_feed_endpoint,
				{'Accept': 'application/vnd.tent.post.v0+json'}
			)
			var paramstring = ''
			for(var key in parameters){
				paramstring += '&' + key + '=' + parameters[key]
			}
			request.uri += paramstring.replace(/&/, '?')
			resolve(sign_and_send(entity_uri, request))
		}).then(function(response){
			return JSON.parse(response.body)
		})
	}

	Server.prototype.new_post = function new_post(content){
		var request = Hattop.createRequest(
			'POST',
			this.entity.endpoints.new_post,
			{'Content-Type': 'application/vnd.tent.post.v0+json; type="'+content.type+'"'},
			JSON.stringify(content)
		)
		return sign_and_send(this.entity.uri, request)
	}

	Server.prototype.get_post = function get_post(content, parameters){
		return post(this.entity.uri, content, 'get', parameters, 'application/vnd.tent.post.v0+json')
	}

	Server.prototype.get_post_mentions = function get_post_mentions(content, parameters){
		return post(this.entity.uri, content, 'get', parameters, 'application/vnd.tent.post-mentions.v0+json')
	}

	Server.prototype.get_post_versions = function get_post_versions(content, parameters){
		return post(this.entity.uri, content, 'get', parameters, 'application/vnd.tent.post-versions.v0+json')
	}

	Server.prototype.get_post_children = function get_post_children(content, parameters){
		return post(this.entity.uri, content, 'get', parameters, 'application/vnd.tent.post-children.v0+json')
	}

	Server.prototype.put_post = function put_post(content){
		return post(this.entity.uri, content, 'put')
	}

	Server.prototype.delete_post = function delete_post(content){
		return post(this.entity.uri, content, 'delete')
	}

	function post(entity, content, method, parameters, accept){
		return new Promise(function(resolve, reject){
			if(!isEntityConnected(entity)) reject(Error('Entity is not connected'))
			if(!content.id) reject(Error('Post id is missing'))
			var endpoint = data.servers[entity].entity.endpoints.post
			var endpoint = endpoint.replace(/{entity}/, encodeURIComponent(content.entity)).replace(/{post}/, content.id)
			if(method == 'get'){
				var request = Hattop.createRequest(
					'GET',
					endpoint,
					{'Accept': accept},
					JSON.stringify(content)
				)
				if(parameters){
					var paramstring = ''
					for(var key in parameters){
						paramstring += '&' + key + '=' + parameters[key]
					}
					request.uri += paramstring.replace(/&/, '?')
				}
			}
			if(method == 'put'){
				var request = Hattop.createRequest(
					'PUT',
					endpoint,
					{'Content-Type': 'application/vnd.tent.post.v0+json; type="'+content.type+'"'},
					JSON.stringify(content)
				)
			} else if(method == 'delete'){
				var request = Hattop.createRequest(
					'DELETE',
					endpoint,
					{}
				)
			}
			resolve(sign_and_send(entity, request))
		})
	}

	function sign_and_send(entity, request){
		var action = new Promise(function(resolve, reject){
			if(!isEntityConnected(entity)) reject(Error('Entity is not connected'))
			request.hawk(
				data.servers[entity].entity.credentials.access_token,
				data.servers[entity].entity.credentials.hawk_key,
				data.servers[entity].entity.client_id
			)
			resolve(request.send())
		})
		if(!isEntityConnected(entity)){
			queue(action, "sign_and_send :231")
		} else {
			return action
		}
	}

	function get_server(entity_uri){
		if(isEntityConnected(entity_uri)){
			return queue(data.servers[entity_uri])
		} else {
			return queue(connect(entity_uri))
		}
	}

	function get_active_entity(){
		return queue(data.active_entity)
	}

	function get_known_entities(){
		return Object.keys(data.servers)
	}

	function connect(entity_uri){
		//Check if entity is a valid url
		//TODO: Consistent error handling
		return new Promise(function(resolve, reject){
			if(!(/^https?:\/\/[^?#]+$/).test(entity_uri))
				reject(Error('Invalid entity'))
			resolve()
		}).then(function(){
			console.log('Q: is entity known?')
			//Check if entity is known
			//If not, register
			if(isEntityKnown(entity_uri)){
				console.log('A: yes')
				return data.servers[entity_uri].entity
			} else {
				console.log('A: no')
				return getMetaPost(entity_uri).then(function(meta){
					var entity = {'uri': entity_uri}
					console.log(meta)
					//TODO: Check whether a valid meta-post is returned
					//TODO: Allow for other servers than the first listed to be used
					entity.endpoints = meta.post.content.servers[0].urls
					var post_endpoint = entity.endpoints.new_post
					return registration(post_endpoint, data.app_data).then(function(reg_data){
						console.log('reg_data', reg_data)
						entity.client_id = reg_data.registration.post.id
						entity.access_token_credentials = {
							'id': reg_data.credentials.post.id,
							'hawk_key': reg_data.credentials.post.content.hawk_key
						}
						rememberEntity(entity)
						data.servers[entity_uri] = new Server(entity)
						return entity
					})
				})	
			}
		}).then(function(entity){
			//Redirect
			authorization_request(
				entity_uri,
				entity.endpoints.oauth_auth,
				entity.client_id,
				Math.random().toString(36).substr(2)
			)
		})
	}

	function load(){
		//load remembered entities
		var entities = JSON.parse(localStorage.getItem('tarp_remembered_entities')) || {}
		//load connected entities
		var sessionEntities = JSON.parse(sessionStorage.getItem('tarp_entities')) || {}
		console.log("session entities:", sessionEntities)
		for(var i in sessionEntities){
			entities[i] = sessionEntities[i]
		}
		for(var i in entities){
			console.log("entity:", i, entities[i])
			data.servers[i] = new Server(entities[i])
		}
		data.active_entity = sessionStorage.getItem('tarp_active_entity')
		console.log('load:', data)
	}

	function store(){
		//store connected entities
		//entities shouldn't be accidentally overwritten, as all entities are loaded at init()
		var entities = {}
		for(var i in data.servers){
			entities[i] = data.servers[i].entity
		}
		console.log('store:', entities)
		sessionStorage.setItem('tarp_entities', JSON.stringify(entities))
		if(typeof data.active_entity == "string"){
			sessionStorage.setItem('tarp_active_entity', data.active_entity)
		}
	}

	function rememberEntity(entity){
		entities = JSON.parse(localStorage.getItem('tarp_remembered_entities')) || {}
		entities[entity.uri] = entity
		localStorage.setItem('tarp_remembered_entities', JSON.stringify(entities))
	}

	function forgetEntity(entity_uri){
		entities = JSON.parse(localStorage.getItem('tarp_remembered_entities')) || {}
		delete(entities[entity_uri])
		localStorage.setItem('tarp_remembered_entities', JSON.stringify(entities))
	}

	function catch_redirect(){
		var re_array = window.location.href.match(/[?&]state=([^&]*)/i)
		if(!re_array) return null
		var observed_state = re_array[1]
		var expected_state = sessionStorage.getItem('tarp_redirect_state')
		if(expected_state != observed_state) return null
		var entity = sessionStorage.getItem('tarp_redirect_entity')
		sessionStorage.removeItem('tarp_redirect_entity')
		sessionStorage.removeItem('tarp_redirect_state')
		data.active_entity = entity
		var oauth_code = (window.location.href.match(/[?&]code=([^&]*)/i))[1]
		return access_token_request(
			data.servers[entity].entity.endpoints.oauth_token,
			oauth_code,
			data.servers[entity].entity.access_token_credentials.id,
			data.servers[entity].entity.access_token_credentials.hawk_key,
			data.servers[entity].entity.client_id
		).then(function(credentials){
			data.servers[entity].entity.credentials = credentials
			store()
		})
	}	

	function isEntityConnected(entity){
		return data.servers[entity]
			&& data.servers[entity].entity
			&& data.servers[entity].entity.credentials
			&& data.servers[entity].entity.credentials.access_token
			&& data.servers[entity].entity.credentials.hawk_key
			&& data.servers[entity].entity.client_id
			&& data.servers[entity].entity.endpoints
			&& data.servers[entity].entity.access_token_credentials
	}

	function isEntityKnown(entity){
		//TODO: Implement a hook for checking for known entities against a database/service.
		return data.servers[entity]
			&& data.servers[entity].entity
			&& data.servers[entity].entity.client_id
			&& data.servers[entity].entity.endpoints
			&& data.servers[entity].entity.access_token_credentials
	}

	function getMetaPost(entity){
		return Hattop.createRequest(
			'GET',
			//TODO: Implement the discovery link as a hook
			'http://tarp.zatnosk.dk/discover.php?entity='+entity,
			{'Accept': 'application/vnd.tent.post.v0+json'}
		).send().then(function(post){
			return JSON.parse(post.body)
		})
		//TODO: Verify that the meta post is sane
	}

	function registration(post_endpoint, app_data){
		//Returns app_post + Link header to app credentials
		//Returns app_credentials
		var result = {
			'registration': null,
			'credentials': null,
			'error': null
		}
		var registrationHeaders = {
			'Content-Type': 'application/vnd.tent.post.v0+json; type="https://tent.io/types/app/v0#"'
		}
		var registrationBody = JSON.stringify({
			'type': 'https://tent.io/types/app/v0#',
			'content': app_data,
			'permissions': {'public': false }
		})
		return Hattop.createRequest(
			'POST',
			post_endpoint,
			registrationHeaders,
			registrationBody
		).send().then(function(registration){
			var linkRE = /<(.*?)>; rel="https:\/\/tent.io\/rels\/credentials"/
			var link = registration.headers.Link.match(linkRE)[1]
			return Hattop.createRequest(
				'GET',
				link,
				{'Accept': 'application/vnd.tent.post.v0+json'}
			).send().then(function(credentials){
				return {
					'credentials': JSON.parse(credentials.body),
					'registration': JSON.parse(registration.body)
				}
			})
		})
	}

	function authorization_request(entity, oauth_endpoint, client_id, state){
		//Redirects to the tent server for authorization
		//TODO: Make sure everything is stored properly
		store()
		sessionStorage.setItem('tarp_redirect_state', state)
		sessionStorage.setItem('tarp_redirect_entity', entity)
		window.location = oauth_endpoint+'?client_id='+client_id+'&state='+state
	}

	function access_token_request(oauth_token_endpoint, code, cred_id, hawk_key, client_id){
		//returns a promise of credentials
		return new Promise(function(resolve, reject){
			var headers = {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
			var request = Hattop.createRequest(
				'POST',
				oauth_token_endpoint,
				headers,
				JSON.stringify({
					'code': code,
					'token_type': 'https://tent.io/oauth/hawk-token'
				})
			)
			request.hawk(cred_id,hawk_key,client_id)
			resolve(request.send().then(function(response){return JSON.parse(response.body)}))
		})
	}

	return init()
}
return Tarp
}))