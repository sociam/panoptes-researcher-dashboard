var width = 600,
    height = 600,
    speed = 1e-2,
    start = Date.now();

var sphere = {type: "Sphere"};

var projection = d3.geo.orthographic()
  .scale(width / 2.1)
  .clipAngle(90)
  .translate([width / 2, height / 2]);

var graticule = d3.geo.graticule();

var canvas = d3.select("#world-container").append("canvas")
  .attr("width", width)
  .attr("height", height);

var context = canvas.node().getContext("2d");

var path = d3.geo.path()
  .projection(projection)
  .context(context);

var coordinates = projection([-6.2597, 53.3478]);

// TODO: ... why give them such non-descriptive names?!
var detachedContainer = document.createElement("custom"); // live stream in the last 10 minutes  Blue
var detachedContainer1 = document.createElement("marker");
var detachedContainer2 = document.createElement("newCustom"); // new live stream updates Red
var detachedContainer3 = document.createElement("newMarker");
var detachedContainer4 = document.createElement("talkCustom"); // comments in the last ten minutes Green
var detachedContainer5 = document.createElement("talkMarker");
var detachedContainer6 = document.createElement("newTalkCustom"); // new comments updates Pink
var detachedContainer7 = document.createElement("newTalkMarker");

// TODO: this is why arrays and loops were invented
var dataContainer = d3.select(detachedContainer);
var dataContainer1 = d3.select(detachedContainer1);
var dataContainer2 = d3.select(detachedContainer2);
var dataContainer3 = d3.select(detachedContainer3);
var dataContainer4 = d3.select(detachedContainer4);
var dataContainer5 = d3.select(detachedContainer5);
var dataContainer6 = d3.select(detachedContainer6);
var dataContainer7 = d3.select(detachedContainer7);

function drawNewCustom(data) {
  // TODO: draw new custom what?!
  
  // default sky blue (0, 191, 255) so that you can see the colour over the dark country background
  var dataBinding2 = dataContainer2.selectAll("newCustom.circle")
    .data(data, function(d) { return d; });

  var dataBinding3 = dataContainer3.selectAll("newMarker.dot")
    .data(data, function(d) { return d; });

  // new dot marker
  dataBinding3.enter()
    .append("newMarker")
    .classed("dot", true)
    .attr("x", data[0])
    .attr("y", data[1])
    .attr("r", data[2])
    .attr("g", data[3])
    .attr("b",data[4])
    .attr("alpha", 1);

  var ripples = 80;
  var count = 0;

  function markerTimer(){
    if (count <= ripples) {
      // ripple animation
      dataBinding2.enter()
        .append("newCustom")
        .classed("circle", true)
        .attr("x", data[0])
        .attr("y", data[1])
        .attr("radius", "1")
        .attr("lineWidth", "2")
        .attr("strokeStyle", "rgba(" + data[2] + ", " + data[3] + ", " + data[4] + ", 1)")
        .transition()
        .ease("linear")
        .duration(2500)
        .ease(Math.sqrt)
        .attr("x", data[0])
        .attr("y", data[1])
        .attr("radius", "25")
        .attr("lineWidth", "0")
        .attr("strokeStyle", "rgba(" + data[2] + ", " + data[3] + ", " + data[4] + ", 0)")
        .remove();
    } else {
      dataBinding3
        .classed("dot", true)
        .transition()
        .duration(500)
        .attr("r", data[5])
        .attr("g", data[6])
        .attr("b", data[7]);
    }
    count++;
  }
  var  markerInterval = setInterval(function() { markerTimer() }, 750);
}

function drawCustom(data) {
  var dataBinding = dataContainer.selectAll("custom.circle")
    .data(data, function(d) { return d; });

  var dataBinding1 = dataContainer1.selectAll("marker.dot")
    .data(data, function(d) { return d; });

  // dot marker
  dataBinding1.enter()
    .append("marker")
    .classed("dot", true)
    .attr("x", data[0])
    .attr("y", data[1])
    .attr("r", data[2])
    .attr("g", data[3])
    .attr("b", data[4])
    .attr("alpha", 1);
}

d3.json("https://d3js.org/world-110m.v1.json", function(error, topo) {
  if (error) throw error;

  var land = topojson.feature(topo, topo.objects.land);
  var borders = topojson.mesh(topo, topo.objects.countries, function(a, b) { return a !== b; });
  var grid = graticule();

  d3.timer(function() {
    // TODO: greek letters?!
    var λ = speed * (Date.now() - start);
    var φ = -15;

    context.clearRect(0, 0, width, height);
    context.beginPath();
    path(sphere);
    context.lineWidth = 3;
    context.strokeStyle = "#000";
    context.stroke();
    context.fillStyle = "#fff";
    context.fill();

    context.save();
    context.translate(width / 2, 0);
    context.scale(-1, 1);
    context.translate(-width / 2, 0);

    projection.rotate([λ + 180, -φ]);

    context.beginPath();
    path(land);
    context.fillStyle = "lightgray";
    context.fill();

    context.beginPath();
    path(grid);
    context.lineWidth = .5;
    context.strokeStyle = "rgba(119,119,119,.5)";
    context.stroke();

    context.restore();
    projection.rotate([λ, φ]);

    context.beginPath();
    path(grid);
    context.lineWidth = .5;
    context.strokeStyle = "rgba(119,119,119,.5)";
    context.stroke();

    context.beginPath();
    path(land);
    context.fillStyle = "black";
    context.fill();
    context.lineWidth = .5;
    context.strokeStyle = "#000";
    context.stroke();

    // add in country borders
    context.beginPath();
    path(borders);
    context.lineWidth = .5;
    context.strokeStyle = "#fff";
    context.stroke();

    var markerDot = dataContainer1.selectAll("marker.dot");
    markerDot.each(function(d) {
      var node = d3.select(this);
      var city = projection([node.attr("x"), node.attr("y")]);

      context.beginPath();
      context.arc(city[0], city[1], 3, 0, 2 * Math.PI, false);
      context.fillStyle = ["rgba(", node.attr("r"), ", ",
                           node.attr("g"), ", ", node.attr("b"), ",",
                           markerFade(), ")"].join("");

      context.fill();
      context.lineWidth = 0;
      context.strokeStyle = "rgba(0, 191, 255, 0)";
      context.stroke();
      context.closePath();

      function markerFade(){
        if(ellipseHorizon() == 0) {
          return "0";
        } else {
          return node.attr("alpha");
        }
      }

      function ellipseHorizon() {
        // obscure location marker when beyond globe's horizon
        var centerPos = projection.invert([width/2,height/2]);
        var arc = d3.geo.greatArc();
        var d = arc.distance({source: [node.attr("x"), node.attr("y")], target: centerPos});

        if (d > 1.57079632679490) {  // TODO: what is this constant?!
          return "0";
        } else {
          return "1.0";
        }
      }
    });

    // TODO: WHY IS THIS FUNCTION COPY/PASTED FROM ABOVE?!
    var newMarkerDot = dataContainer3.selectAll("newMarker.dot");
    newMarkerDot.each(function(d) {
      var node = d3.select(this);
      var city = projection([node.attr("x"), node.attr("y")]);

      context.beginPath();
      context.arc(city[0], city[1], 3, 0, 2 * Math.PI, false); // radius was 8
      context.fillStyle = "rgba("+ Math.abs(Math.floor(node.attr("r"))) +", "+ Math.abs(Math.floor(node.attr("g"))) +", "+ Math.abs(Math.floor(node.attr("b"))) +"," +  markerFade() +")";

      context.fill();
      context.lineWidth = 0;
      context.strokeStyle = "rgba(0, 191, 255, 0)";
      context.stroke();
      context.closePath();

      function markerFade(){
        if(ellipseHorizon() == 0) {
          return "0";
        } else {
          return node.attr("alpha");
        }
      }

      function ellipseHorizon() {
        // obscure location marker when beyond globe's horizon
        var centerPos = projection.invert([width/2,height/2]);
        var arc = d3.geo.greatArc();
        var d = arc.distance({source: [node.attr("x"), node.attr("y")], target: centerPos});

        if (d > 1.57079632679490) {  // TODO: this constant popped up earlier and I have no idea what it means
          return "0";
        } else {
          return "1.0";
        }
      }
    });

    // live stream - last 10 minutes - ripple fade out animation :)
    var customCircle = dataContainer.selectAll("custom.circle");
    customCircle.each(function(d) {
      var node = d3.select(this);

      var city = projection([node.attr("x"), node.attr("y")]);

      context.beginPath();
      context.arc(city[0], city[1], node.attr("radius"), 0, 2 * Math.PI, false);
      context.fillStyle = "rgba(0, 0, 0, 0)"; // colour is irrelevant as this animation simply fades out
      context.fill();
      context.lineWidth = node.attr("lineWidth");
      context.strokeStyle = node.attr("strokeStyle");
      context.stroke();
      context.closePath();
    });

    // new live stream - constant update - ripple fade out animation :)
    var newCustomCircle = dataContainer2.selectAll("newCustom.circle");
    newCustomCircle.each(function(d) {
      var node = d3.select(this);
      var city = projection([node.attr("x"), node.attr("y")]);

      context.beginPath();
      context.arc(city[0], city[1], node.attr("radius"), 0, 2 * Math.PI, false);
      context.fillStyle = "rgba(0, 0, 0, 0 )"; // colour is irrelevant as this animation simply fades out
      context.fill();
      context.lineWidth = node.attr("lineWidth");
      context.strokeStyle = node.attr("strokeStyle");
      context.stroke();
      context.closePath();
    });
  });
});

function showUserInfo(ID){
  console.log("ID: " + ID);
  $("p.p" + ID).toggle(); // toggle display of extra user information on and off

  $("#" + ID).text(function(i, text){
    return text === "more" ? "less" : "more";
  })
}

function liveComments(userData){
  var element = document.createElement("div");
  var datePosted = new Date(userData.timestamp);
  var humanRead = datePosted.toUTCString();

  // TODO: WHAAAAAAAAAAAAAAAAAAAAAAAAAAT?!
  element.innerHTML = '<div class="row"><div class="col-sm-10" ><div class="col-sm-1"><div class="thumbnail"><img class="img-responsive user-photo" src="./static/images/avatar-small.png"></div></div><div class="col-sm-10"><div class="panel panel-default"><div class="panel-heading"><strong>' + userData.user_id +
    '</strong> <span class="text-muted">posted on ' + humanRead + '</span></div><div class="panel-body">' + userData.body + '</div></div></div</div></div>';

  console.log("element.innerHTML: " + element.innerHTML);
  $('#comment-box').prepend(function() { return element; });
}

function removeUserInfo(){
  $("#user-info").empty();
}

// TODO: this is basically the same function as above... why copy and paste?
function updateComments(userData){
  var element = document.createElement("div");

  var datePosted = new Date(userData.timestamp);
  var humanRead = datePosted.toUTCString();

  element.innerHTML = '<div class="row"><div class="col-sm-10" ><div class="col-sm-1"><div class="thumbnail"><img class="img-responsive user-photo" src="./static/images/avatar-small.png"></div></div><div class="col-sm-10"><div class="panel panel-default"><div class="panel-heading"><strong>' + userData.user_id +
    '</strong> <span class="text-muted">posted on ' + humanRead + '</span></div><div class="panel-body">' + userData.body + '</div></div></div</div></div>';

  d3.select("#comment-box").append(function() { return element; });
}

function appendUserInfo(userData){
  var element = $("#" + userData.user_id);
  var lastActiveDate = new Date(userData.timestamp);
  var currentDate =  new Date();
  var diffMs = (currentDate - lastActiveDate); // milliseconds between now & Christmas
  var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

  element.text("string");
  pID++;
}

// TODO: again this is almost literally the same function, WHY WHY WHY
function liveUserInfo(userData){
  var element = document.createElement("div");
  element.setAttribute("id", userData[0].user_id );

  var lastActiveDate = new Date(userData.timestamp);
  var currentDate =  new Date();
  var diffMs = (currentDate - lastActiveDate); // milliseconds between now & 10 minutes ago
  var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

  element.innerHTML = '<p><div class="well"><span class="text-muted">User ID </span> <strong>' + userData.user_id +
    '</strong></p><p><span class="text-muted">last online </span> <strong>' + diffMins +
    ' minutes ago</strong><p style="display:none;" class="p' + pID + '"><span class="text-muted">country </span> <strong>' + userData.country_name +
    '</strong></p><p style="display:none;" class="p' + pID + '"><span class="text-muted">project ID </span> <strong>' + userData.project_id + '</strong></p><p style="display:none;" class="p' + pID +
    '"><span class="text-muted">subjects </span> <strong>' + userData.subjects + '</strong></p><button id="' + pID +'" onclick="showUserInfo(this.id)">more</button></div>';

  $('#user-info').prepend(function() { return element; });

  pID++;
}

// TODO: SAME FUNCTION AGAIN?!?!?!?!?!?!?!
function userInfo(userData){
  var element = document.createElement("div");
  element.setAttribute("id", userData[0].user_id );
  var lastActiveDate = new Date(userData[0].timestamp);
  var currentDate =  new Date();
  var diffMs = (currentDate - lastActiveDate); // milliseconds between now & Christmas
  var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

  element.innerHTML = '<p><div class="well"><span class="text-muted">User ID </span> <strong>' + userData[0].user_id +
    '</strong></p><p><span class="text-muted">last online </span> <strong>' + diffMins +
    ' minutes ago</strong><p style="display:none;" class="p' + pID + '"><span class="text-muted">country </span> <strong>' + userData[0].country_name +
    '</strong></p><p style="display:none;" class="p' + pID + '"><span class="text-muted">project ID </span> <strong>' + userData[0].project_id + '</strong></p><p style="display:none;" class="p' + pID +
    '"><span class="text-muted">subjects </span> <strong>' + userData[0].subjects + '</strong></p><button id="' + pID +'" onclick="showUserInfo(this.id)">more</button></div>';

  d3.select("#user-info").append(function() { return element; });
  pID++;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var commentsOrderByDate = [];
var usersOrderByDate = [];
var socket = io.connect('http://localhost:3005');
socket.on('userData', function(userData) {
  // classifications within the last ten minutes (blue)
  usersOrderByDate = userData; // copy userData into a sortable array
  usersOrderByDate.sort(function(a,b) {
    return new Date(a[0].timestamp) - new Date(b[0].timestamp); // sort largest first
  });

  for (var count = userData.length - 1; count>-1; count--) {
    userInfo(usersOrderByDate[count]);
    drawCustom([userData[count][0].lat, userData[count][0].lng, 0, 191, 255]);
  }

  // top countries
  var countryBlock = "";
  for (var i = userData.length - 1; i>-1; i--) {
    countryBlock = countryBlock.concat(" " + userData[i][0].country_name.replace(/\ /g, "xxx"));
  }

  var pattern = /\w+/g;
  var matchedWords = countryBlock.match( pattern );

  /* The Array.prototype.reduce method assists us in producing a single value from an
     array. In this case, we're going to use it to output an object with results. */
  var counts = matchedWords.reduce(function (stats, word) {

    /* `stats` is the object that we'll be building up over time.
       `word` is each individual entry in the `matchedWords` array */
    if ( stats.hasOwnProperty( word ) ) {
      /* `stats` already has an entry for the current `word`.
         As a result, let's increment the count for that `word`. */
      stats[ word ] = stats[ word ] + 1;
    } else {
      /* `stats` does not yet have an entry for the current `word`.
         As a result, let's add a new entry, and set count to 1. */
      stats[ word ] = 1;
    }

    /* Because we are building up `stats` over numerous iterations,
       we need to return it for the next pass to modify it. */
    return stats;

  }, {});

  // Now that `counts` has our object, we can log it.
  var sortable = [];
  for (var word in counts)
    sortable.push([word, counts[word]]);

  sortable.sort(function(a, b) {
    return   b[1] - a[1]
  })

  console.log("top country frequencies 1st: " + sortable[0][0].replace(/\xxx/g, " ") );
  console.log("top country frequencies 2nd: " + sortable[1][0].replace(/\xxx/g, " ") );
  console.log("top country frequencies 3rd: " + sortable[2][0].replace(/\xxx/g, " ") );

  $('#first-country').html(sortable[0][0].replace(/\xxx/g, " "));
  $('#second-country').html(sortable[1][0].replace(/\xxx/g, " "));
  $('#third-country').html(sortable[2][0].replace(/\xxx/g, " "));

  // once users have been added from the last 10 minute window then add new live users
  socket.on('panoptes_classifications', function(classify) {
    // latitude, longitude, R, G, B
    drawNewCustom([classify.lat, classify.lng, 255, 0, 0, 0, 191, 255]);
  });
})


socket.on('comments', function(userData) {
  // copy userData into a sortable array
  commentsOrderByDate = userData.slice(0);
  commentsOrderByDate.sort(function(a,b) {
    return new Date(a.timestamp) - new Date(b.timestamp); // sort largest first
  });

  for (var count1 = commentsOrderByDate.length - 1; count1>-1; count1--) {
    // TODO: what is being tested here?
    // TEST
    drawCustom([commentsOrderByDate[count1].latitude, commentsOrderByDate[count1].longitude, 0, 255, 0]); // green
    updateComments(commentsOrderByDate[count1]);
  }
});

socket.on('panoptes_talk', function(userData) {
  console.log("new data!");
  drawNewCustom([userData.latitude, userData.longitude, 255,215,0,0,255,0]);   liveComments(userData);
});

// online users append HTML test
var p = "p";
var pID = 0;

d3.select(self.frameElement).style("height", height + "px");
