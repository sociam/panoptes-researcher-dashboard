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

function findPanoptesProjectByID(data, callback) {
  let id = data.project_id;
  let projObj = {
    slug: ''
  };

  findPanoptesObjectByID(id, 'projects', projObj, callback);
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
        let project = projects[0];
        let projectInfo = {
          name: project.display_name,
          slug: project.slug
        }

        data.project = projectInfo;

        saveData(mongo.db, data, mdls.classification.model);
      });
    }
  );

  let commentEvents = socket.subscribe('talk');
  commentEvents.bind('comment',
    function (data) {
      findPanoptesUserByID(data, function (users) {
        let user = users[0];
        let userInfo = {
          login: user.login,
          username: user.display_name,
          thumbnail: user.avatar_src
        };

        data.user = userInfo;

        saveData(mongo.db, data, mdls.talk.model);
      });
    }
  );
}

module.exports.start = start;
