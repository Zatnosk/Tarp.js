var http_mock = (function(){
	var serverURL = '<link href="https://mockup.zat" rel="https://tent.io/rels/profile">'

	var profile = '{\
						"https://tent.io/types/info/core/v0.1.0":{\
							"servers": ["https://tent.mockup.zat"]\
						}\
					}'

	var response = function(body){
		var  headers = {'Status': '200 OK'}
		return {"headers": headers,
					"body": body,
					"error": false}
	}

	var http = function(request){
		http_request = request
		console.log("Request:",request)
		if(request.URL ==  "https://zatnosk.tent.is")
			return response(serverURL)
		else if(request.URL == "https://mockup.zat")
			return response(profile)
		else if(request.URL == "https://tent.mockup.zat/followings")
			return response('{"TODO": "followings"}')
		else
			return response('{"TODO":"rest of this mock"}')
	}
	return http
}())

if(typeof http == "undefined"){
	var http = http_mock
}