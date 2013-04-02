var DEBUG = false;
//REQUIRES crypto.js

var tentAPI = (function(){
	var algorithms = {
		'HmacSHA256': function(data, key){
			return CryptoJS.HmacSHA256(data,key).toString(CryptoJS.enc.Base64)
		},
		'HmacSHA1': function(data,key){
			return CryptoJS.HmacSHA1.toString(CryptoJS.enc.Base64)
		},
		'base64_encode': CryptoJS.enc.Base64.stringify
}

var entity = function(profile){
	this.profile = profile;
	this.entityURL = profile["https://tent.io/types/info/core/v0.1.0"].entity;
	this.APIroot = profile["https://tent.io/types/info/core/v0.1.0"].servers[0];
	this.postFollowings = function(content){
		var URL = this.APIroot+"/followings";
		return tentPOST(URL, content);
	}
	this.getFollowings = function(parameters){
		var URL = this.APIroot+"/followings";
		return tentGET(URL, parameters);
	};
	this.getFollowingsId = function(id){
		var URL = this.APIroot+"/followings/"+id;
		return tentGET(URL);
	};
	this.getFollowingsEntity = function(entity){
		var URL = this.APIroot+"/followings/"+encodeURIComponent(entity);
		return tentGET(URL);
	};
	this.deleteFollowingsId = function(id){
		var URL = this.APIroot+"/followings/"+id;
		return tentDELETE(URL);
	}
	this.getFollowers = function(parameters){
		var URL = this.APIroot+"/followers";
		return tentGET(URL, parameters);
	};
	this.getFollowersId = function(id){
		var URL = this.APIroot+"/followers/"+id;
		return tentGET(URL);
	};
	this.getFollowersEntity = function(entity){
		var URL = this.APIroot+"/followers/"+encodeURIComponent(entity);
		return tentGET(URL);
	};
	this.deleteFollowersId = function(id){
		var URL = this.APIroot+"/folowers/"+id;
		return tentDELETE(URL);
	};
	this.postPosts = function(content){
		var URL = this.APIroot+"/posts";
		return tentPOST(URL, content);
	};
	this.getPosts = function(parameters){
		var URL = this.APIroot+"/posts";
		return tentGET(URL, parameters);
	};
	this.getPostsId = function(id){
		var URL = this.APIroot+"/posts";
		return tentGET(URL);
	};
	this.postAttachments = function(){
		/* NOT IMPLEMENTED YET */
		return {"error": "Not implemented yet"};
	};
	this.getAttachments = function(){
		/* NOT IMPLEMENTED YET */
		return {"error": "Not implemented yet"};
	};
	this.getMentions = function(id, parameters){
		var URL = this.APIroot+"/posts/"+id+"/mentions";
		return tentGET(URL, parameters);
	};
	this.putPosts = function(id, content){
		var URL = this.APIroot+"/posts/"+id;
		return tentPUT(URL, content);
	};
	this.getPostsIdVersions = function(id, parameters){
		var URL = this.APIroot+"/posts/"+id+"/versions";
		return tentGET(URL, parameters);
	};
	this.deletePostsId = function(id, version){
		var URL = this.APIroot+"/posts/"+id+(version ? "?version="+version : "");
		return tentDELETE(URL);
	};
	this.postGroups = function(content){
		var URL = this.APIroot+"/groups";
		return tentPOST(URL, content);
	};
	this.getGroups = function(){
		var URL = this.APIroot+"/groups";
		return tentGET(URL);
	};
	this.putGroupsId = function(id){
		var URL = this.APIroot+"/groups/"+id;
		return tentPUT(URL, content);
	};
	this.getGroupsId = function(id){
		var URL = this.APIroot+"/groups/"+id;
		return tentGET(URL);
	};
	this.deleteGroupsId = function(id){
		var URL = this.APIroot+"/groups/"+id;
		return tentDELETE(URL);
	};
};

var discoverydance = function(entityURL){
	var profileURL;
	var webpage = http({"method": "GET", "URL": entityURL});
	if(webpage.headers && webpage.headers.Link){
		var re = /^<(.*?)>; rel="https:\/\/tent.io\/rels\/profile"$/gi;
		var match = re.exec(webpage.headers.Link);
		if(match){
			profileURL = match[1]
		}
	}
	if(!profileURL){
		/* this regular expression might be a bit too wonky */
		var re = /<link *(?:href="(.*?)" *rel="https:\/\/tent.io\/rels\/profile"|rel="https:\/\/tent.io\/rels\/profile" *href="(.*?)") *\/?>/gi;
		var match = re.exec(webpage.body);
		if(match){
			if(match[1]){
				profileURL = match[1];
			} else if (match[2]){
				profileURL = match[2];
			}
		}
	}
	var profile = tentGET(profileURL).body;
	if(typeof profile["https://tent.io/types/info/core/v0.1.0"] === 'undefined') return null;
	return new entity(profile);
};

var composeParameters = function(parameterList){
	var parameters = "";
	for(var param in parameterList){
		parameters += parameterList[param]? (parameters? "&" : "?") + param + "=" + parameterList[param] : "";
	}
	return parameters;
};

var headerGenerators = {
	"Authorization": "",
	"Accept": "application/vnd.tent.v0+json",
	"Content-Type": "application/vnd.tent.v0+json"
}

var composeHeaders = function(headerList){
	if(headerList){
		var headers = {};
		for(var i = 0; i < headerList.length; i++){
			headers[headerList[i]] = headerGenerators[headerList[i]];
		}
		return headers;
	} else {
		return {};
	}
}

var tentGET = function(URL, parameters){
	URL = URL + composeParameters(parameters);
	headers = composeHeaders(["Accept", "Authorization"]);
	relevantResponseHeaders = ["statuscode", "status", "Link"];
	response = http({"method": "GET", "URL": URL, "headers": headers})
	if(!response.error && response.body){
		response.body = JSON.parse(response.body);
	}
	return response;
};

var tentPOST = function(URL, content){
	var body = JSON.stringify(content);
	headers = composeHeaders(["Accept", "Content-Type", "Authorization"]);
	relevantResponseHeaders = ["statuscode", "status", "ETag"];
	response = http({"method": "POST", "URL": URL, "headers": headers, "body": body});
	if(!response.error && response.body){
		response.body = JSON.parse(response.body);
		return response;
	} else {
		return null;
	}
};

var tentPUT = function(URL, content){
	var body = JSON.stringify(content);
	headers = composeHeaders(["Accept", "Content-Type", "Authorization"]);
	relevantResponseHeaders = ["statuscode", "status", "ETag"];
	response = http({"method": "PUT", "URL": URL, "headers": headers, "body": body});
	if(!response.error && response.body){
		response.body = JSON.parse(response.body);
		return response;
	} else {
		return null;
	}
};

var tentDELETE = function(URL){
	headers = composeHeaders(["Accept", "Authorization"]);
	relevantResponseHeaders = ["statuscode", "status"];
	response = http({"method": "DELETE", "URL": URL, "headers": headers});
	if(!response.error && response.body){
		response.body = JSON.parse(response.body);
		return response;
	} else {
		return null;
	}
};

var signRequest = function(request, auth){
	var re = /^http(s?):\/\/(.*?)(?:\:(.*))?(\/.*)/gi;
	var match = re.exec(request.URL)

	console.log(match)
	var port = match[1] ? "443" : "80"
	var domain = match[2]
	port = match[3] || port
	var path = match[4] || "/"
	console.log(port, domain, path)

	var ts = Math.round((new Date()).getTime() / 1000)
	var nonce = Math.random().toString(16).substr(2,6)
	var normalizedRequestString =
	ts					+ '\x0A'
	+ nonce 			+ '\x0A'
	+ request.method 	+ '\x0A'
	+ path 				+ '\x0A'
	+ domain 			+ '\x0A'
	+ port 				+ '\x0A\x0A'
	var mac = ""
	console.log(normalizedRequestString)
	if(auth.algorithm == "hmac-sha-256"){
		mac = algorithms.HmacSHA256(normalizedRequestString, auth.key)
	} else if(auth.algorithm = "hmac-sha-1"){
		mac = algorithms.HmacSHA1(normalizedRequestString, auth.key)
	}
	var authString = 'MAC id="'+auth.id+'", ts="'+ts+'", nonce="'+nonce+'", mac="'+mac+'"'
	request.headers['Authorization'] = authString
	return request
}

return {
	"getEntity": discoverydance,
	"algorithms": algorithms,
	"sign": signRequest
}
}())
