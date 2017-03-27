var express = require('express');
var Pusher = require('pusher-client');
var panoptesAPI = require('panoptes-client/lib/api-client');
var models = require('./db-models.js');

function findPanoptesObjectByID(id, apiType, defaultObj, callback) {
  try {
    panoptesAPI.type(apiType).get({id: id}).then(callback);
  } catch (e) {
    console.error(e);
    callback(defaultObj);
  }
}

function findPanoptesUserByID(data, callback) {
  let id = data.user_id;
  let userObj = {
    name: 'Unknown User',
    thumbnail: null
  };

  findPanoptesObjectByID(id, 'users', userObj, callback);
}

function getUserInfo(usersResponse) {
  let user = usersResponse[0];
  return {
    login: user.login,
    profile_url: 'https://www.zooniverse.org/users/' + user.login,
    thumbnail: user.avatar_src,
    username: user.display_name
  };
}

function findPanoptesProjectByID(data, callback) {
  let id = data.project_id;
  let projObj = {
    slug: ''
  };

  findPanoptesObjectByID(id, 'projects', projObj, callback);
}

function getProjectInfo(projectsResponse) {
  let project = projectsResponse[0];
  return {
    name: project.display_name,
    slug: project.slug,
    url: 'https://www.zooniverse.org/projects/' + project.slug
  };
}

function saveData(source, obj, model) {
  obj.created_at = new Date().toISOString();
  try {
    let doc = new model({
      source: source,
      status: obj
    });

    doc.save(function(e, doc) {
      if (e) {
        console.error('error indexing document: ' + JSON.stringify(doc));
        throw e;
      }
    });
  } catch(e) {
    console.error(e);
  }
}

/*
 * Subscribe to Pusher channels, create database connections, etc.
 */
function start(db, mongo, pusherSocket) {
  let mdls = models(db);

  // Create incoming Pusher socket
  let socket = new Pusher(pusherSocket, {
    encrypted: true
  });

  // Subscribe to talk and classification channels
  let classificationEvents = socket.subscribe('panoptes');
  classificationEvents.bind('classification',
    function(data) {
      findPanoptesProjectByID(data, function (projects) {
        data.project = getProjectInfo(projects);
        saveData(mongo.db, data, mdls.classification.model);
      });
    }
  );

  let commentEvents = socket.subscribe('talk');
  commentEvents.bind('comment',
    function (data) {
      findPanoptesUserByID(data, function (users) {
        data.user = getUserInfo(users);
        findPanoptesProjectByID(data, function (projects) {
          data.project = getProjectInfo(projects);
          saveData(mongo.db, data, mdls.talk.model);
        });
      });
    }
  );
}

module.exports.start = start;
