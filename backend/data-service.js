var express = require('express');
var Pusher = require('pusher-client');
var panoptesAPI = require('panoptes-client/lib/api-client');
var models = require('./db-models.js');

function findPanoptesUserByID(data, callback) {
  let id = data.user_id;
  try {
    panoptesAPI.type('users').get({id: id}).then(callback);
  } catch(e) {
    console.log(e);
    user = {
      name: 'Unknown User',
      thumbnail: null
    };
    callback(user);
  }
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
    console.log(e);
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
      saveData(mongo.db, data, mdls.classification.model);
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
          profile: data.url,
          thumbnail: user.avatar_src,
          body: data.body,
        };

        data.user = userInfo;
        saveData(mongo.db, data, mdls.talk.model);
      });
    }
  );
}

module.exports.start = start;
