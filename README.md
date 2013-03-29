tentjs
======
A JavaScript client library for the Tent protocol.
###Tent v0.3
Considering that v0.3 of the Tent protocol is likely to be rolled out, before I get authorization working, there will be no updates before everything is refactored to run with v0.3

Work is still being done, but I probably wont upload any until it is reasonable "stable", i.e. able to post and read statuses on v0.3.

###Interface
tent.js creates a global object named *tentAPI*. It has a single function, which takes the URL of a Tent entity:

    tentAPI.getEntity(URL);

This creates a new *entity* object and performs the "discovery dance". The *entity* object has a number of functions mirroring the [API calls documented on tent.io](https://tent.io/docs/app-server):

    deleteFollowersId   (id)
    deleteFollowingsId  (id)
    deleteGroupsId      (id)
    deletePostsId       (id, version)
    getAttachments      ()              // not implemented yet
    getFollowers        (parameters)
    getFollowersEntity  (entity)
    getFollowersId      (id)
    getFollowings       (parameters)
    getFollowingsEntity (entity)
    getFollowingsId     (id)
    getGroups           ()
    getGroupsId         (id)
    getMentions         (id, parameters)
    getPosts            (parameters)
    getPostsId          (id)
    getPostsIdVersions  (id, parameters)
    postAttachments     ()              // not implemented yet
    postFollowings      (content)
    postGroups          (content)
    postPosts           (content)
    putGroupsId         (id)
    putPosts            (id, content)

The parameters should be as follows:

    id:         a string containing the id of a post, follower, followee or group
    version:    a string or number containing the version number of a post
    parameters: a json object containing the name and value pairs of parameters described in tent.io docs
    content:    a json object fulfilling the structure of a post type, following or group

###Todo
 - Implement OAuth2
 - Implement getting and posting attachments
 - Test post, put and delete requests
 - Implement automatic unit testing (or something like it)
