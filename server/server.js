/*
 * Author: Ramine Tinati
 * Purpose: Node server for Panoptes Researcher Dashboard
 */
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
//var config = require('./config');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Pusher = require('pusher-client');

/*
 * Server listening port. This must be configured correctly.
 * Find the port associated with your group and configure appropriately.
 */
app.listen(3005);

/*
 * Define connections to databases and models here.
 * If this is being run locally, the address for datasets must be:
 * var mongo_url = 'mongodb://sotonwo.cloudapp.net/';
 */
var mongo_url = 'mongodb://woUser:webobservatory@localhost/zoo_panoptes';
var db_pm = mongoose.createConnection(mongo_url);
db_pm.on('error', console.error.bind(console, 'connection error:'));
db_pm.once('open', function (callback) {
  console.log('connected to database zoo_panoptes');
});

/*
 * Mongoose requires a schema for a database connection. This is then attached
 * to a collection.
 */
var pmDoc = new mongoose.Schema({
  source: String,
  status: String,
});

/*
 * Link the schemas to the collections.
 */
var pm_Model = db_pm.model('classifications', pmDoc);
var pm_Model_Talk = db_pm.model('talk', pmDoc);

/*
 * Pusher
 * Connect using pusher-client object, then bind to channel and emit stream.
 */
var socket = new Pusher('79e8e05ea522377ba6db', {
  encrypted: true
});

var channel = socket.subscribe('panoptes');
channel.bind('classification',
  function(data) {
    constructAndEmitLiveStream(data);
  };
);

var channelTwo = socket.subscribe('talk');
channelTwo.bind('comment',
  function(data) {
    constructTalkAndEmitLiveStream(data);
  };
);

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
function constructAndEmitLiveStream(data) {
  var toSend = {};
  try {
    toSend['id'] = data.classification_id;
    toSend['country_name'] = data.geo.country_name;
    toSend['country_code'] = data.geo.country_code;
    toSend['user_id'] = data.user_id
    toSend['project_id'] = data.project_id
    toSend['subjects'] = data.classification_id
    toSend['created_at'] = new Date().toISOString()
    toSend['lat'] = data.geo.coordinates[0]
    toSend['lng'] = data.geo.coordinates[1]

    io.emit('panoptes_classifications', toSend)

    try {
      // send data to db
      saveData(toSend)
    } catch(e_inner) {
      console.log(e_inner)
    }
  } catch(e_outer) {
    console.log(e_outer)
  }
}

function constructTalkAndEmitLiveStream(data) {
  var toSend = {};
  try {
    toSend['id'] = data.project_id;
    toSend['board_id'] = data.board_id;
    toSend['discussion_id'] = data.discussion_id;
    toSend['user_id'] = 0;
    toSend['project_id'] = data.project_id;
    toSend['section'] = data.section;
    toSend['subject_id'] = data.focus_id;
    toSend['created_at'] = new Date();
    toSend['lat'] = 0;
    toSend['lng'] = 0;

    io.emit('panoptes_talk', toSend)
    try {
      // send data to db
      saveDataTalk(toSend)
    } catch(e_inner) {
      console.log(e_inner);
    }
  } catch(e_outer) {
    console.log(e_outer)
  }
}

function saveData(obj) {
  try {
    var doc = new pm_Model({
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
    console.log(e)
  }
}


function saveDataTalk(obj){
  try {
    var doc = new pm_Model_Talk({
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
    console.log(e)
  }
}


/*
 * Socket.IO
 * When a connection is established with a client, the connection port receives
 * a handshake.
 */
io.on('connection', function (socket) {
  // we want to automatically load the data to the client
  socket.on('load_data', function (data) {
    console.log('Loading Map Data');
    loadHistoricClassificationData(socket);
  });

  /*
   * we will then proceed to load the pollution data...
   *
   * socket.on('load_pollution_data', function (data) {
   *   console.log('Socket load_pollution_data called');
   *   //console.log('emitting filter:', filter);
   *   loadPollutionTweets(socket);
   * });
   */
});


/*
 * Functions
 * This function retrieves ALL the pollution data in the collection and streams
 * it to the client.
 */
function loadHistoricClassificationData(socket){
  console.log('Loading Historic Classification Data Timeseries');

  var toSend = [];
  var stream = pm_Model.find().stream();
  stream.on('data', function (doc) {
    // do something with the mongoose document
    var status = JSON.parse(doc.status);
    toSend.push(status.created_at);
  }).on('error', function (err) {
    // handle error
  }).on('close', function () {
    // the stream is closed
    // pre-process timestamps and then send them
    preprocessTimestamps(toSend,socket);
    toSend = [];
  });
}

function preprocessTimestamps(toSend,socket){
  console.log('sending pre-processed timestamps as historic data');
  var timestamp_dist = {};
  var timeseries = [];

  for (var i = 0; i < toSend.length; i++) {
    var data = toSend[i];
    var tstamp = Date.parse(data)
      var timestamp = dateFormat(tstamp, 'yyyy-mm-dd hh:00:00');

    if (timestamp in timestamp_dist) { // TODO: this is bad practice, fix
      var cnt = timestamp_dist[timestamp];
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
 * Miscellaneous HTTP functions
 */
function handler (req, res) {
  res.writeHead(200);
  res.end('');
}
