//Author: Ramine Tinati
//Purpose: Node server for the Citizen Engagement Dashboard

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
//var config = require('./config');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Pusher = require('pusher-client');


//-------------------
//This is the working port
//PLEASE NOTE: You must configure this in order for this to correctly run. 
//Please find the port associate with your group and configure
app.listen(3005);




//-----------------------------
//SECTION: Databases and models
//We need to connect ot each of the datasets that we're going to be using.
//if you have more, follow the same pattern to connect
//NOTE: If you are running this locally, then the address for these datasets needs to be:
//  mongodb://sotonwo.cloudapp.net/

//Panoptes DATA
var pm_con = mongoose.createConnection('mongodb://woUser:webobservatory@localhost/zoo_panoptes');
var db_pm = pm_con;
db_pm.on('error', console.error.bind(console, 'connection error:'));
db_pm.once('open', function (callback) {
    console.log("connected to database zoo_panoptes");
});




// //INFO: Mongoose requires that for a database connection, we create a schema, 
// //INFO: this is then attached to a collection. 
// //INFO: Three Schemas (but could use one if you wanted)
var pmDoc = new mongoose.Schema({
  source: String,
  status: String,
});


// //INFO: These are the collections and models linked together
 var pm_Model = pm_con.model('classifications', pmDoc); 
// // var air_pollution_Model = air_pollution_con.model('tweets_20151100', twitterDoc_pol); 
// // var shenzhen_Model = shenzhen_con.model('tweets_20151100', twitterDoc); 




//----------------------------
//SECTION: Pusher Work
//INFO: Connec using the pusher-client object, then bind to a channel and emit the stream
var socket = new Pusher('79e8e05ea522377ba6db',{
  encrypted: true
});
var channel = socket.subscribe('panoptes');

//console.log("trying to get data from pusher...")
channel.bind('classification',
  function(data) {

  //console.log(data)

    constructAndEmitLiveStream(data);

  }
);


var channelTwo = socket.subscribe('talk');

channelTwo.bind('comment',
  function(data) {

    console.log(data)

   // constructAndEmitLiveStream(data);

  }
);




// { classification_id: '10054109',
//   project_id: '593',
//   workflow_id: '338',
//   user_id: '1447883',
//   geo:
//    { country_name: 'Greece',
//      country_code: 'GR',
//      city_name: 'Athens',
//      coordinates: [ 23.7333, 37.9833 ],
//      latitude: 37.9833,
//      longitude: 23.7333 } }

function constructAndEmitLiveStream(data){

  //here we need to construct the object to confirm to what we were used to.

  var toSend = {};

  try{

    toSend["id"] = data.classification_id;
    toSend["country_name"] = data.geo.country_name;
    toSend["country_code"] = data.geo.country_code;
    toSend["user_id"] = data.user_id
    toSend["project_id"] = data.project_id
    toSend["subjects"] = data.classification_id
    toSend["created_at"] = new Date().toISOString()
    toSend["lat"] = data.geo.coordinates[0]
    toSend["lng"] = data.geo.coordinates[1]
 
    //console.log("data")

    io.emit("panoptes_classifications", toSend)

    //also need to send this data to the database.
    try{
      saveData(toSend)
      //console.log("saving data")
    }catch(e1){
        //console.log(e1)
    }

  }catch(e){

      //console.log(e)

  }

}


function saveData(obj){

    try{
        
        //console.log("Data: "+obj);

        var doc = new pm_Model({
            source: "panoptes_zooniverse",
            status: JSON.stringify(obj),
        });

        doc.save(function(err, doc) {
        if (err) return console.error(err);
        //console.dir(thor);
        });
            
            
        //console.log("Added New Items: "+data);
        //emit to real-time
      return true;
        }catch(e){
          console.log(e)
        }

}





//----------------------------
//SECTION: SOCKET IO work

//INFO: When a connection is established with a client, the 'connection' port recieves a handshake
io.on('connection', function (socket) {

     //we want to automatically load the data to the client
     socket.on('load_data', function (data) {
        console.log("Loading Map Data");
        //console.log("emitting filter:", filter); 
        loadHistoricClassificationData(socket);  
    });

    //  //we will then proceed to load the pollution data
    //  socket.on('load_pollution_data', function (data) {
    //     console.log("Socket load_pollution_data called");
    //     //console.log("emitting filter:", filter); 
    //     loadPollutionTweets(socket);      
    // });
});


//----------------------------
//SECTION: Functions 

//INFO: This function retrieves ALL the pollution data in the collection and streams it to the client
function loadHistoricClassificationData(socket){
    console.log("Loading Historic Classification Data Timeseries");

    var toSend = [];

    var stream = pm_Model.find().stream();

    stream.on('data', function (doc) {
       var status = JSON.parse(doc.status);
        //console.log(status.created_at);  
        toSend.push(status.created_at);
        //socket.emit("historic_data", toSend);
        //toSend = [];
      // do something with the mongoose document
    }).on('error', function (err) {
      // handle the error
    }).on('close', function () {        
      // the stream is closed

        //pre-process timestamps and then send them
        preprocesstimestamps(toSend,socket);

       // socket.emit("finished_sending_historic_classification_data", "");
        toSend = [];
        //loadPM25Data(socket)
    });

}


function preprocesstimestamps(toSend,socket){

 console.log("sending pre-processed timestamps as historic data")
  var timestamp_dist = {};
  var timeseries = [];

  for(var i=0; i<toSend.length; i++) {

    var data = toSend[i];
    var tstamp = Date.parse(data)
    var timestamp = dateFormat(tstamp, "yyyy-mm-dd hh:00:00");

    if(timestamp in timestamp_dist){
        var cnt = timestamp_dist[timestamp];
        timestamp_dist[timestamp] =cnt + 1
    }else{
        timestamp_dist[timestamp] = 1
    }

  }
        socket.emit("historic_data", timestamp_dist);


}



//########################
//NOTE: General patterns for retrieving data from the db and sending data to the client
// 1. Client requests data using a socket pulse
// 2. Server queries database using stream, sends data back to client via socket
// 3. When all data is finished being sent, server notifies client with new socket pulse
// 4. Server the proceeds to the next dataset.
//NOTE: Currently this happens sequentially, but this is not necessary...!
//#######################







//INFO: Misc functions whihc we use for the HTTP server.
function showErr (e) {
    console.error(e, e.stack);
}

function handler (req, res) {
    res.writeHead(200);
    res.end("");
}

