var tests = function(context){
	this.context = context
}

tests.prototype.discoverydance = function(){
	this.discoverydance.text = "discover {{=it.entityURL}}"
	this.context.entity = tentAPI.getEntity(this.context.entityURL)
	console.log("Discovery test:",this.context.entityURL, this.context.entity);
	if(this.context.entity == null) return false
	return true
},
tests.prototype.getFollowings = function(){
	this.getFollowings.text = "<i>tentAPI.getFollowings</i>"
	if(!this.context.entity) return undefined
	var entity = this.context.entity
	if(!entity.getFollowings || typeof entity.getFollowings !== 'function'){
		console.log(".getFollowings() does not exist");
		return false;
	}
	this.context.followings = entity.getFollowings()
	console.log("Followings:", this.context.followings)
	return this.context.followings && this.context.followings.headers.Status == "200 OK" ? true : false
}
tests.prototype.getFollowingsId = function(){
	this.getFollowingsId.text = "<i>tentAPI.getFollowingsId</i>"
	if(!this.context.followings
		|| !this.context.followings.body
		|| !this.context.followings.body[0]
		|| !this.context.followings.body[0].id
		) return undefined
	var id = this.context.followings.body[0].id
	if(!this.context.entity) return undefined
	var entity = this.context.entity
	if(!entity.getFollowingsId || typeof entity.getFollowingsId !== 'function'){
		console.log(".getFollowingsId() does not exist");
		return false;
	}
	var following = entity.getFollowingsId(id)
	console.log("Following (id):", following)
	return following && following.headers.Status == "200 OK" ? true : false
}
tests.prototype.getFollowingsEntity = function(){
	this.getFollowingsEntity.text = "<i>tentAPI.getFollowingsEntity</i>"
	if(!this.context.followings
		|| !this.context.followings.body
		|| !this.context.followings.body[0]
		|| !this.context.followings.body[0].entity
		) return undefined
	var following_entity = this.context.followings.body[0].entity
	if(!this.context.entity) return undefined
	var entity = this.context.entity
	if(!entity.getFollowingsEntity || typeof entity.getFollowingsEntity !== 'function'){
		console.log(".getFollowingsEntity() does not exist");
		return false;
	}
	var following = entity.getFollowingsEntity(following_entity)
	console.log("Following (entity):", following)
	return following && following.headers.Status == "200 OK" ? true : false
}
tests.prototype.getFollowers = function(){
	this.getFollowers.text = "<i>tentAPI.getFollowers</i>"
	if(!this.context.entity) return undefined
	var entity = this.context.entity
	if(!entity.getFollowers || typeof entity.getFollowers !== 'function'){
		console.log(".getFollowers() does not exist");
		return false;
	}
	this.context.followers = entity.getFollowers()
	console.log("Followers:", this.context.followers)
	return this.context.followers && this.context.followers.headers.Status == "200 OK" ? true : false
}
tests.prototype.getFollowersId = function(){
	this.getFollowersId.text = "<i>tentAPI.getFollowersId</i>"
	if(!this.context.followers
		|| !this.context.followers.body
		|| !this.context.followers.body[0]
		|| !this.context.followers.body[0].id
		) return undefined
	var id = this.context.followers.body[0].id
	if(!this.context.entity) return undefined
	var entity = this.context.entity
	if(!entity.getFollowersId || typeof entity.getFollowersId !== 'function'){
		console.log(".getFollowersId() does not exist");
		return false;
	}
	var follower = entity.getFollowersId(id)
	console.log("Follower (id):", follower)
	return follower && follower.headers.Status == "200 OK" ? true : false
}
tests.prototype.getFollowersEntity = function(){
	this.getFollowersEntity.text = "<i>tentAPI.getFollowersEntity</i>"
	if(!this.context.followers
		|| !this.context.followers.body
		|| !this.context.followers.body[0]
		|| !this.context.followers.body[0].entity
		) return undefined
	var follower_entity = this.context.followers.body[0].entity
	if(!this.context.entity) return undefined
	var entity = this.context.entity
	if(!entity.getFollowersEntity || typeof entity.getFollowersEntity !== 'function'){
		console.log(".getFollowersEntity() does not exist");
		return false;
	}
	var follower = entity.getFollowersEntity(follower_entity)
	console.log("Follower (entity):", follower)
	return follower && follower.headers.Status == "200 OK" ? true : false
}
tests.prototype.getPosts = function(){
	this.getPosts.text = "<i>tentAPI.getPosts</i>"
	var entity = this.context.entity
	if(!entity.getPosts || typeof entity.getPosts !== 'function'){
		console.log(".getPosts() does not exist");
		return false;
	}
	this.context.posts = entity.getPosts()
	console.log("Posts:", this.context.posts)
	return this.context.posts && this.context.posts.headers.Status == "200 OK" ? true : false
}
