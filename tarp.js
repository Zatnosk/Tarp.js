var Tarp = (function(){
	var TARP = function(app_data){
		var redirecting_id = sessionStorage.getItem('tarp_js_redirecting_id')
		if(redirecting_id){
			var code = getURLparams().code
			var session = new Session(redirecting_id)
			var credentials = auth_landing(session, code)
			session.credentials = credentials
			sessionStorage.setItem(storage_prefix(session)+'credentials', JSON.stringify(credentials))
		}
		sessionStorage.removeItem('tarp_js_redirecting_id')

		storage.app_data = app_data
		var active_sessions = JSON.parse(sessionStorage.getItem('tarp_js_active_sessions'))
		var sessions = []
		for(var i in active_sessions){
			var id = active_sessions[i]
			if(storage.sessions[id] && storage.sessions[id].self){
				var s = storage.sessions[id].self
			} else {
				var s = new Session(id)
			}
			sessions.push(s)
		}
		if(sessions.length == 0){
			sessions.push(new Session())
		}
		return sessions
	}

	TARP.print = function(){
		function log(prefix,name){
			console.log(name+':',sessionStorage.getItem(prefix+name))
		}
		console.log('storage:', storage)
		console.log('redirecting_id:',sessionStorage.getItem('tarp_js_redirecting_id'))
		for(var i in storage.sessions){
			var prefix = storage_prefix(storage.sessions[i].self)
			console.log('prefix', prefix)
			log(prefix, 'entity')
			log(prefix, 'server_endpoints')
			log(prefix, 'credentials')
			log(prefix, 'client_id')
			log(prefix, 'state')
			log(prefix, 'credential_post_id')
			log(prefix, 'app_hawk_key')
		}
	}

	var plumbing = {
		'discovery': undefined,
		'http': HTTPSend
	}
	TARP.plumbing = plumbing
	//TODO: Refactor error handling to throw errors as early as possible, and catch and recover when possible.
	/*** BEGIN INTERNAL HELPERS ***/
	function storage_prefix(session){
		return 'tarp_js_'+session.id+'_'
	}
	function HTTPSend(request){
		//TODO: implement async http
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
		var xhr = new XMLHttpRequest()
		xhr.open(request.method, request.URL, false)
		//xhr.withCredentials = true;
		if(request.headers){
			for(header in request.headers){
				xhr.setRequestHeader(header, request.headers[header])
			}
		}
		if(request.body){
			xhr.send(request.body)
		} else {
			xhr.send()
		}
		if(xhr.readyState != 4){
			console.error("error: response not recieved")
			return {"error": "response not received"}
		}
		return {"headers": parseHeaders(xhr.getAllResponseHeaders()),
				"body": xhr.responseText,
				"error": null}
	}

	function HTTPRequest(method, URL, headers, body){
		this.method = method
		this.URL = URL
		this.headers = headers
		this.body = body
	}

	function getURLparams(){
		var data = window.location.href.match(/[?&]([^=&]*)=([^&]*)/g)
		var params = {}
		if(data){
			for(var i in data){
				var pair = data[i].match(/[?&]([^=]*)=(.*)/)
				params[pair[1]] = pair[2]
			}
		}
		return params
	}
	/*** END INTERNAL HELPERS ***/
	/*** BEGIN TENT PROTOCOL FUNCTIONS ***/
	function auth_redirect(session, reg, creds){
		//Persist needed data in session storage
		var prefix = storage_prefix(session)
		//generate and persist state
		var state = Math.random().toString(36).substr(2)
		sessionStorage.setItem(prefix+'state', state)
		//persist app registration post id
		sessionStorage.setItem(prefix+'client_id', reg.id)
		//persist credentials post id
		sessionStorage.setItem(prefix+'credential_post_id', creds.id)
		//persist hawk key from credentials post
		sessionStorage.setItem(prefix+'app_hawk_key', creds.content.hawk_key)
		//persist server endpoints
		sessionStorage.setItem(prefix+'server_endpoints', JSON.stringify(session.endpoints))
		sessionStorage.setItem('tarp_js_redirecting_id', session.id)
		return session.endpoints.oauth_auth+'?client_id='+reg.id+'&state='+state
	}

	function auth_landing(session, code){
		var prefix = storage_prefix(session)
		var client_id = sessionStorage.getItem(prefix+'client_id')
		var cred_id = sessionStorage.getItem(prefix+'credential_post_id')
		var hawk_key = sessionStorage.getItem(prefix+'app_hawk_key')
		var headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
		var request = new HTTPRequest(
			'POST',
			session.endpoints.oauth_token,
			headers,
			JSON.stringify({
				'code': code,
				'token_type': 'https://tent.io/oauth/hawk-token'
			})
		)
		request.headers.Authorization = hawk.client.header(session.endpoints.oauth_token, 'POST', {'credentials':{
				'id': cred_id,
				'key': hawk_key,
				'algorithm': 'sha256'
			},
			'app': client_id,
			'payload': request.body,
			'contentType': 'application/json'
		}).field
		var response = HTTPSend(request)
		if(response.error){throw new Error('Authorization error: '+response.error)}
		var credentials = JSON.parse(response.body)
		return credentials
	}

	function registerApp(post_endpoint, app_info){
		//postEndpoint must be the new_post endpoint from the meta post.
		//app_info must be a json object with information about the app satifying the App Registration Schema
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
			'content': app_info,
			'permissions': {'public': false }
		})
		var registration = HTTPSend(
			new HTTPRequest(
				'POST',
				post_endpoint,
				registrationHeaders,
				registrationBody
			)
		)
		if(registration.error){
			result.error = 'Registration: '+registration.error
			return result
		}
		result.registration = JSON.parse(registration.body)
		var linkRE = /<(.*?)>; rel="https:\/\/tent.io\/rels\/credentials"/
		var link = registration.headers.Link.match(linkRE)[1]
		var credentials = HTTPSend(
			new HTTPRequest(
				'GET',
				link,
				{'Accept': 'application/vnd.tent.post.v0+json'}
			)
		)
		if(credentials.error){
			result.error = 'Credentials: '+credentials.error
		} else {
			result.credentials = JSON.parse(credentials.body)
		}
		return result
	}
	/*** END TENT PROTOCOL FUNCTIONS ***/
	/*** BEGIN VERIFICATION HELPERS ***/
	function verify_meta(meta){
		return (meta
		&& meta.post
		&& meta.post.content
		&& meta.post.content.servers
		&& meta.post.content.servers[0].urls)
	}
	function verify_app_data(app_data){
		return true
	}
	/*** END VERIFICATION HELPERS ***/
	/*** BEGIN CLASS-LIKE OBJECTS ***/
	function Session(id){
		/* Attributes:
			.id
			.entity
			.endpoints
		*/
		if(!id){
			this.id = Math.random().toString(36).substr(2)
			storage.active_sessions.push(this.id)
			sessionStorage.setItem('tarp_js_active_sessions', JSON.stringify(storage.active_sessions))
			
		} else {
			this.id = id
			//load persisted data
			this.entity = sessionStorage.getItem(storage_prefix(this)+'entity')
			this.endpoints = JSON.parse(sessionStorage.getItem(storage_prefix(this)+'server_endpoints'))
			this.credentials = JSON.parse(sessionStorage.getItem(storage_prefix(this)+'credentials'))
		}
		storage.sessions[this.id] = {'self': this}
	}

	Session.prototype.register = function(entity){
		this.entity = entity
		sessionStorage.setItem('tarp_js_'+this.id+'_entity', entity)
		//TODO: should try the rest of the server list if first server fails
		var server_index = 0 //constant

		var app_data = storage.app_data
		if(!verify_app_data(app_data)){throw new Error('Invalid app data, could not continue registration')}
		var meta_page = HTTPSend(new HTTPRequest(
			'GET',
			plumbing.discovery(entity),
			{'Accept': 'application/vnd.tent.post.v0+json'}
		))
		var meta = JSON.parse(meta_page.body)
		if(!verify_meta(meta)){throw new Error('Invalid meta post, could not continue registration')}
		this.endpoints = meta.post.content.servers[server_index].urls
		var result = registerApp(this.endpoints.new_post, app_data)
		var redirect = auth_redirect(this, result.registration.post, result.credentials.post)
		window.location = redirect
	}

	Session.prototype.feed = function(parameters, head){
		var request = new HTTPRequest(
			'GET',
			this.endpoints.posts_feed,
			{'Accept': 'application/vnd.tent.post.v0+json'}
		)
		if(head){request.method = 'HEAD'}
		var options = {
			'credentials':{
				'id': this.credentials.access_token,
				'key': this.credentials.hawk_key,
				'algorithm': 'sha256'
			},
			'app': sessionStorage.getItem(storage_prefix(this)+'client_id')
		}
		
		var paramstring = ''
		for(var key in parameters){
			paramstring += '&' + key + '=' + parameters[key]
		}
		request.URL += paramstring.replace(/&/, '?')
		request.headers.Authorization = hawk.client.header(request.URL, request.method, options).field
		var response = HTTPSend(request)
		if(response.error){return response}
		if(head){return response.headers.Count}
		return JSON.parse(response.body)
	}

	Session.prototype.new_post = function(content){
		var request = new HTTPRequest(
			'POST',
			this.endpoints.new_post,
			{'Content-Type': 'application/vnd.tent.post.v0+json; type="'+content.type+'"'},
			JSON.stringify(content)
		)
		var options = {
			'credentials':{
				'id': this.credentials.access_token,
				'key': this.credentials.hawk_key,
				'algorithm': 'sha256'
			},
			'app': sessionStorage.getItem(storage_prefix(this)+'client_id'),
			'payload': request.body,
			'contentType': 'application/vnd.tent.post.v0+json'
		}
		request.headers.Authorization = hawk.client.header(this.endpoints.new_post, 'POST', options).field
		console.log(request)
		HTTPSend(request)
	}
	/*** END CLASS-LIKE OBJECTS ***/

	var storage = {
		'app_data': {},
		'active_sessions': [],
		'sessions': {}
	}

	return TARP
})()