/*
 * Author: Ramine Tinati
 * Purpose: Node server for Panoptes Researcher Dashboard
 */
var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Pusher = require('pusher-client');


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
let pmDoc = new mongoose.Schema({
  source: String,
  status: String,
});


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
function constructAndEmitLiveStream(data, io, pm_model) {
  let toSend = {};
  try {
    toSend['id'] = data.classification_id;
    toSend['country_name'] = data.geo.country_name;
    toSend['country_code'] = data.geo.country_code;
    toSend['user_id'] = data.user_id;
    toSend['project_id'] = data.project_id;
    toSend['subjects'] = data.classification_id;
    toSend['created_at'] = new Date().toISOString();
    toSend['lat'] = data.geo.latitude;
    toSend['lng'] = data.geo.longitude;
    toSend['country'] = data.geo.country_name;
    toSend['city'] = data.geo.city_name;

    io.emit('panoptes_classifications', toSend)
    try {
      // send data to db
      saveData(toSend, pm_model)
    } catch(e_inner) {
      console.log(e_inner)
    }
  } catch(e_outer) {
    console.log(e_outer)
  }
}


function constructTalkAndEmitLiveStream(data, io, pm_model_talk) {
  console.log(data);
  let toSend = {};
  try {
    toSend['id'] = data.project_id;
    toSend['board_id'] = data.board_id;
    toSend['discussion_id'] = data.discussion_id;
    toSend['user_id'] = data.user_id;
    toSend['project_id'] = data.project_id;
    toSend['section'] = data.section;
    toSend['subject_id'] = data.focus_id;
    toSend['created_at'] = new Date();
    toSend['lat'] = data.geo.latitude;
    toSend['lng'] = data.geo.longitude;
    toSend['country'] = data.geo.country_name;
    toSend['city'] = data.geo.city_name;
    toSend['body'] = data.body;

    io.emit('panoptes_talk', toSend);
    try {
      // send data to db
      saveDataTalk(toSend, pm_model_talk)
    } catch(e_inner) {
      console.log(e_inner);
    }
  } catch(e_outer) {
    console.log(e_outer);
  }
}


function saveData(obj, pm_model) {
  try {
    let doc = new pm_model({
      source: 'panoptes_zooniverse',
      status: JSON.stringify(obj),
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


function saveDataTalk(obj, pm_model_talk){
  try {
    let doc = new pm_model_talk({
      source: 'panoptes_zooniverse',
      status: JSON.stringify(obj),
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
function loadHistoricClassificationData(socket, pm_model){
  console.log('Loading Historic Classification Data Timeseries');

  let toSend = [];
  let stream = pm_model.find().stream();
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
function start(http_port) {
  // Create MongoDB connections
  let db_pm = mongoose.createConnection(mongo_url);
  db_pm.on('error', console.error.bind(console, 'connection error:'));
  db_pm.once('open', function (callback) {
    console.log('connected to database zoo_panoptes');
  });

  // Link schemas to MongoDB collections
  let pm_model = db_pm.model('classifications', pmDoc);
  let pm_model_talk = db_pm.model('talk', pmDoc);

  // Create HTTP handler/HTTP server stuff
  let handler = function (req, res) {
    res.writeHead(200);
    res.end('There is nothing here on page \'/\'.');
  }

  // Server listening port is 3005. *Must* be configured correctly.
  let app = http.createServer(handler);
  app.listen(http_port);

  // Socket.IO
  let io = socketio(app);
  io.on('connection', function (socket) {
    // we want to automatically load the data to the client
    socket.on('load_data', function (data) {
      console.log('Loading Map Data');
      loadHistoricClassificationData(socket);
    });
  });

  // Create Pusher socket
  let socket = new Pusher('79e8e05ea522377ba6db', {
    encrypted: true
  });

  // Subscribe to Pusher channels
  let channel = socket.subscribe('panoptes');
  channel.bind('classification',
    function(data) {
      constructAndEmitLiveStream(data, io, pm_model);
    }
  );

  let channelTwo = socket.subscribe('talk');
  channelTwo.bind('comment',
    function(data) {
      constructTalkAndEmitLiveStream(data, io, pm_model_talk);
    }
  );
}

module.exports.start = start;
