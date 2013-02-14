var DEBUG = false;
var tentAPI = (function(){
	var APPDATA = {
		//TODO: implement authorization
		"Authorization": undefined,
		"Accept": "application/vnd.tent.v0+json",
		"Content-Type": "application/vnd.tent.v0+json"
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
		var webpage = http("GET", entityURL, undefined, undefined, ["Link"]);
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

	var composeParameters = function(parameterlist){
		var parameters = "";
		for(var param in parameterlist){
			parameters += parameterlist[param]? (parameters? "&" : "?") + param + "=" + parameterlist[param] : "";
		}
		return parameters;
	};

	var composeHeaders = function(headerList){
		if(headerList){
			var headers = {};
			for(var i = 0; i < headerList.length; i++){
				headers[headerList[i]] = APPDATA[headerList[i]];
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
		response = http("GET", URL, headers, undefined, relevantResponseHeaders)
		if(response){
			response.body = JSON.parse(response.body);
			return response;
		} else {
			return null;
		}
	};

	var tentPOST = function(URL, content){
		var body = JSON.stringify(content);
		headers = composeHeaders(["Accept", "Content-Type", "Authorization"]);
		relevantResponseHeaders = ["statuscode", "status", "ETag"];
		response = http("POST", URL, headers, body, relevantResponseHeaders);
		return response;
	};

	var tentPUT = function(URL, content){
		var body = JSON.stringify(content);
		headers = composeHeaders(["Accept", "Content-Type", "Authorization"]);
		relevantResponseHeaders = ["statuscode", "status", "ETag"];
		response = http("PUT", URL, headers, body, relevantResponseHeaders);
	};

	var tentDELETE = function(URL){
		headers = composeHeaders(["Accept", "Authorization"]);
		relevantResponseHeaders = ["statuscode", "status"];
		response = http("DELETE", URL, headers, undefined, relevantResponseHeaders);
	};

	var http = (function(){
		var isValidHTTPMethod = function(method){
			return method == "GET" || method == "POST" || method == "PUT" || method == "DELETE";
		};

		var isValidURL = function(URL){
			/* not null or undefined */
			return !!URL;
		};

		var isValidHeaders = function(headers){
			/* not implemented */
			return true;
		};

		var isContentAllowed = function(method, content){
			if(method == "GET", "DELETE"){
				return false;
			} else {
				return true;
			}
		};

		var error = function(msg){
			console.log("ERROR in HTTP request: "+msg);
		};

		return function(method, URL, headers, body, relevantResponseHeaders){
			var request = new XMLHttpRequest();
			/* begin assertions */
			if(!isValidHTTPMethod(method)){
				error("bad HTTP method");
				return null;
			}
			if(!isValidURL(URL)){
				error("bad URL");
				return null;
			}
			if(!isValidHeaders(headers)){
				error("bad headers");
				return null;
			}
			/* end assertions */
			/* begin debug */
			if(DEBUG){
				var debugstring = method + " " + URL + "\n";
				for(var i = 0; headers != undefined && i < headers.length; i++){
					debugstring += headers[i].header + ": "+  headers[i].value + "\n";
				}
				debugstring += "\n" + body;
				console.log("/* begin request */\n",debugstring,"\n/* end request */");
			}
			/* end debug */
			request.open(method, URL, false);
			for(header in headers){
				if(headers[header]) request.setRequestHeader(header, headers[header]);
			}
			if(isContentAllowed(method, body)){
				request.send(body);
			} else {
				request.send();
			}
			if(request.readyState != 4){
				error("response not received");
				return null;
			}
			/* begin debug */
			if(DEBUG){
				console.log("/* begin response */\n", {text:request.responseText}, "\n/* end response */")
			}
			/* end debug */
			var responseHeaders = {};
			if(relevantResponseHeaders == "all"){
				responseHeaders = request.getAllResponseHeaders();
				//TODO: should be parsed into object notation
			} else if (typeof relevantResponseHeaders === "object" && relevantResponseHeaders != null){
				for(var i = 0; i < relevantResponseHeaders.length; i++){
					var name = relevantResponseHeaders[i];
					if(name == "statuscode"){
						responseHeaders[name] = request.status;
					} else {
						header = request.getResponseHeader(name)
						if(header != null){
							responseHeaders[name] = header;
						}
					}	
				}
			}
			return {headers: responseHeaders,body: request.responseText};
		};
	}());

	return {
		getEntity: discoverydance
	};
}());
