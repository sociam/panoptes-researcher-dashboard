/*
 * Author: Ramine Tinati
 * Purpose: Node server for Panoptes Researcher Dashboard
 */
var express = require('express');
var socketio = require('socket.io');
var fs = require('fs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Pusher = require('pusher-client');
var panoptesAPI = require('panoptes-client/lib/api-client');


/*
 * Keep track of the n most recent comments. Update and broadcast the list.
 */
var MAX_RECENT_COMMENTS_LENGTH = 15;
var recent_comments = [];


/*
 * Define connections to databases and models here.
 * If this is being run locally, the address for datasets must be:
 * let mongo_url = 'mongodb://sotonwo.cloudapp.net/';
 *
 * or for production, address must be:
 * let mongo_url = 'mongodb://woUser:webobservatory@localhost/zoo_panoptes/';
 */
let mongo_url = 'mongodb://localhost/zoo_panoptes';


/*
 * Mongoose requires a schema for a database connection. This is then attached
 * to a collection.
 */
let classificationSchema = new mongoose.Schema({
  source: String,
  status: {
    classification_id: Number,
    project_id: Number,
    workflow_id: Number,
    board_id: Number,
    user_id: Number,
    subject_ids: [Number],
    geo: {
      country_name: String,
      country_code: String,
      city_name: String,
      coordinates: [Number],
      latitude: Number,
      longitude: Number
    }
  }
});

let talkSchema = new mongoose.Schema({
  source: String,
  status: {
    id: Number,
    board_id: Number,
    discussion_id: Number,
    user_id: Number,
    project_id: Number,
    section: String,
    subject_id: Number,
    created_at: String,
    lat: Number,
    lng: Number
  }
});


/*
 * Store comment and user information in a list
 */
function updateRecentComments(list, data, io) {
  findPanoptesUserByID(data, function (users) {
    let user = users[0];
    list.push({
      timestamp: data.created_at,
      login: user.login,
      username: user.display_name,
      url: data.url,
      thumbnail: user.avatar_src,
      body: data.body,
      subject_id: data.subject_id
    });

    if (list.length > MAX_RECENT_COMMENTS_LENGTH) {
      list.shift();
    }

    io.emit('panoptes_talk', {
      latest: data,
      recent: recent_comments
    });
  });
}

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


/*
 * Store geographic information in a list
 */

/*
 * Format for incoming data;
 *
 * {
 *   classification_id: '10054109',
 *   project_id: '593',
 *   workflow_id: '338',
 *   user_id: '1447883',
 *   geo: {
 *     country_name: 'Greece',
 *     country_code: 'GR',
 *     city_name: 'Athens',
 *     coordinates: [ 23.7333, 37.9833 ],
 *     latitude: 37.9833,
 *     longitude: 23.7333
 *   }
 * }
 */
function emitClassifications(data, io, classificationModel) {
  let toSend = {};
  try {
    toSend['id'] = data.project_id;
    toSend['classification_id'] = data.classification_id;
    toSend['country_name'] = data.geo.country_name;
    toSend['country_code'] = data.geo.country_code;
    toSend['user_id'] = data.user_id;
    toSend['subjects'] = data.classification_id;
    toSend['created_at'] = new Date().toISOString();
    toSend['lat'] = data.geo.latitude;
    toSend['lng'] = data.geo.longitude;
    toSend['country'] = data.geo.country_name;
    toSend['city'] = data.geo.city_name;

    io.emit('panoptes_classifications', toSend);

    // send data to db
    try {
      saveClassificationData(data, classificationModel)
    } catch(e_inner) {
      console.log(e_inner)
    }
  } catch(e_outer) {
    console.log(e_outer)
  }
}


function emitComments(data, io, talkModel) {
  let toSend = {};
  try {
    toSend['id'] = data.project_id;
    toSend['board_id'] = data.board_id;
    toSend['discussion_id'] = data.discussion_id;
    toSend['user_id'] = data.user_id;
    toSend['section'] = data.section;
    toSend['subject_id'] = data.focus_id;
    toSend['created_at'] = new Date();
    toSend['lat'] = data.geo.latitude;
    toSend['lng'] = data.geo.longitude;
    toSend['country'] = data.geo.country_name;
    toSend['city'] = data.geo.city_name;
    toSend['body'] = data.body;
    toSend['url'] = data.url;

    // update recent comments, emit to bound clients
    updateRecentComments(recent_comments, toSend, io);

    // save to database
    try {
      saveTalkData(data, talkModel);
    } catch(e_inner) {
      console.log(e_inner);
    }
  } catch(e_outer) {
    console.log(e_outer);
  }
}


function saveClassificationData(obj, classificationModel) {
  try {
    let doc = new classificationModel({
      source: 'panoptes_zooniverse',
      status: obj,
    });

    doc.save(function(err, doc) {
      if (err) {
        return console.error(err);
      }
    });

    return true;
  } catch(e) {
    console.log(e);
  }
}


function saveTalkData(obj, talkModel){
  try {
    let doc = new talkModel({
      source: 'panoptes_zooniverse',
      status: obj,
    });

    doc.save(function(err, doc) {
      if (err)  {
        return console.error(err);
      }
    });

    return true;
  } catch(e) {
    console.log(e);
  }
}


/*
 * Functions
 * This function retrieves ALL the pollution data in the collection and streams
 * it to the client.
 */
function loadHistoricClassificationData(socket, classificationModel){
  console.log('Loading Historic Classification Data Timeseries');

  let toSend = [];
  let stream = classificationModel.find().stream();
  stream.on('data', function (doc) {
    // do something with the mongoose document
    let status = JSON.parse(doc.status);
    toSend.push(status.created_at);
  }).on('error', function (err) {
    // handle error
  }).on('close', function () {
    // the stream is closed
    // pre-process timestamps and then send them
    preprocessTimestamps(toSend, socket);
    toSend = [];
  });
}


function preprocessTimestamps(toSend, socket){
  console.log('sending pre-processed timestamps as historic data');
  let timestamp_dist = {};
  let timeseries = [];

  for (let i = 0; i < toSend.length; i++) {
    let data = toSend[i];
    let tstamp = Date.parse(data)
      let timestamp = dateFormat(tstamp, 'yyyy-mm-dd hh:00:00');

    if (timestamp in timestamp_dist) { // TODO: this is bad practice, fix
      let cnt = timestamp_dist[timestamp];
      timestamp_dist[timestamp] =cnt + 1
    } else {
      timestamp_dist[timestamp] = 1
    }
  }

  socket.emit('historic_data', timestamp_dist);
}


/*
 * General pattern for retrieving data and sending to client...
 *   1. Client requests data using a socket pulse
 *   2. Server queries database using stream, sends data to client via socket
 *   3. When all data is sent, server notifies client with new socket pulse
 *   4. Server then proceeds to next dataset.
 * Currently this happens sequentially, but this is not necessary.
 */


/*
 * "Start" function subscribes to Pusher notifications, creates, database
 * connections, and starts the HTTP server.
 */
function start(io) {
  // Create MongoDB connections
  let db = mongoose.createConnection(mongo_url);
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function (callback) {
    console.log('connected to database zoo_panoptes');
  });

  // Link schemas to MongoDB collections
  let classificationModel = db.model('classifications', classificationSchema);
  let talkModel = db.model('talk', talkSchema);

  // Create Pusher socket
  let socket = new Pusher('79e8e05ea522377ba6db', {
    encrypted: true
  });

  // Subscribe to Pusher channels
  let classificationEvents = socket.subscribe('panoptes');
  classificationEvents.bind('classification',
    function(data) {
      emitClassifications(data, io, classificationModel);
    }
  );

  let commentEvents = socket.subscribe('talk');
  commentEvents.bind('comment',
    function(data) {
      emitComments(data, io, talkModel);
    }
  );
}

module.exports.start = start;
