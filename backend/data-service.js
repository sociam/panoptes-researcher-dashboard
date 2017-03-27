var express = require('express');  // web server/app
var marked = require('marked');  // parse MarkDown comments
var Pusher = require('pusher-client');  // incoming data from Panoptes
var panoptesAPI = require('panoptes-client/lib/api-client');  // query extra data from Panoptes
var models = require('./db-models.js');  // internal database models

// set up the markdown renderer
var renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
  return `<a href="${href}" title="${title}" target="_blank">${text}</a>`
}
renderer.image = renderer.link;  // render images as links in the dashboard

function findPanoptesObjectByID(id, apiType, defaultObj, callback, data) {
  panoptesAPI.type(apiType).get({id: id})
    .then(function (obj) {
      if (obj && obj.length > 0) {
        callback(obj[0]);
      } else {
        callback(defaultObj);
      }
    }).catch(function (e) {
      console.error('caught error: ' + e);
      callback(defaultObj);
    });
}

function findPanoptesUserByID(data, callback) {
  let id = data.user_id;
  let userObj = {
    name: 'Unknown User',
    thumbnail: null
  };
  findPanoptesObjectByID(id, 'users', userObj, callback);
}

function getUserInfo(user) {
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
    display_name: 'Unknown Project',
    slug: '#',
    url: '#'
  };
  findPanoptesObjectByID(id, 'projects', projObj, callback, data);
}

function getProjectInfo(project) {
  return {
    name: project.display_name,
    slug: project.slug,
    url: 'https://www.zooniverse.org/projects/' + project.slug
  };
}

function findPanoptesSubjectByID(data, callback) {
  let id = data.focus_id;
  let subjObj = {};
  findPanoptesObjectByID(id, 'subjects', subjObj, callback);
}

function getSubjectInfo(subject) {
  let images = [];
  for (let i = 0; i < subject.locations.length; i+= 1) {
    let image = subject.locations[i];
    if (image) {
      for (let key in image) {
        if (image.hasOwnProperty(key)) {
          images.push(image[key]);
        }
      }
    }
  }

  return {
    images: images.length > 0 ? images : null,
    created_at: subject.created_at
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

      // remove pointless image/jpeg or image/png objects from data
      let images = [];
      for (let i = 0; i < data.subject_urls.length; i+= 1) {
        let image = data.subject_urls[i];
        if (image) {
          for (let key in image) {
            if (image.hasOwnProperty(key)) {
              images.push(image[key]);
            }
          }
        }
      }
      data.subject_urls = images;

      findPanoptesProjectByID(data, function (projects) {
        data.project = getProjectInfo(projects);
        saveData(mongo.db, data, mdls.classification.model);
      });
    }
  );

  let commentEvents = socket.subscribe('talk');
  commentEvents.bind('comment',
    function (data) {
      // TODO: refactor to use ES6 generators, you evil evil person
      data.body_html = marked(data.body, {renderer: renderer});
      findPanoptesUserByID(data, function (users) {
        data.user = getUserInfo(users);
        findPanoptesProjectByID(data, function (projects) {
          data.project = getProjectInfo(projects);
          findPanoptesSubjectByID(data, function(subjects) {
            data.subject = getSubjectInfo(subjects);
            saveData(mongo.db, data, mdls.talk.model);
          });
        });
      });
    }
  );
}

module.exports.start = start;
