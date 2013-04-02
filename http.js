var http_ = function(request){
	var verifyRequest = function(request){

	}
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
	//TODO: verify if request is valid
	var xhr = new XMLHttpRequest()
	console.log(request.method, request.URL)
	xhr.open(request.method, request.URL, false)
	for(header in request.headers){
		if(typeof request.headers[header] == "function"){
			request.headers[header] = headers[header]
		}
		console.log(header, request.headers[header])
		xhr.setRequestHeader(header, request.headers[header])
	}
	if(request.body){
		console.log(request.body)
		xhr.send(request.body)
	} else {
		xhr.send()
	}
	if(xhr.readyState != 4){
		console.log("error: response not recieved")
		return {"error": "response not received"}
	}
	return {"headers": parseHeaders(xhr.getAllResponseHeaders()),
			"body": xhr.responseText,
			"error": null}
}

if(typeof http == "undefined"){
	var http = http_
}