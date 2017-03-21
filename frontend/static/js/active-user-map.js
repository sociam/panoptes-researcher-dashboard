/*
 * Constants
 */
MARKER_TIMEOUT_MILLIS = 5 * 60 * 1000;  // 5 minutes
COMMENT_TIMEOUT_MILLIS = 5 * 60 * 1000; // 5 minutes

/*
 * Callback functions
 */

function showUserInfo(ID){
  console.log('ID: ' + ID);
  $('p.p' + ID).toggle(); // toggle display of extra user information on and off

  $('#' + ID).text(function(i, text){
    return text === 'more' ? 'less' : 'more';
  })
}

function addComment(data) {
  $('#comment-box').prepend(function () {
  let elem = document.createElement('div');

  elem.innerHTML = `
    <div class="row">
      <div class="col-sm-10">
        <div class="col-sm-1">
          <div class="thumbnail">
            <img class="img-responsive user-photo" src="static/images/avatar-small.png">
          </div>
        </div>
        <div class="col-sm-10">
          <div class="panel panel-default">
            <div class="panel-heading">
              <strong>${data.user_id}</strong>
              <span class="text-muted pull-right">Posted on: ${data.created_at}</span>
            </div>
          <div class="panel-body">
            ${data.body}
          </div>
        </div>
      </div>
    </div>`;
  
    setTimeout(function () {
      elem.parentNode.removeChild(elem);
    }, COMMENT_TIMEOUT_MILLIS);

    return elem;
  });
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

  for (var count = userData.length - 1; count > -1; count -= 1) {
    userInfo(usersOrderByDate[count]);
    drawCustom([userData[count][0].lat, userData[count][0].lng, 0, 191, 255]);
  }

  // top countries
  var countryBlock = '';
  for (var i = userData.length - 1; i > -1; i -= 1) {
    countryBlock = countryBlock.concat(' ' + userData[i][0].country_name.replace(/\ /g, 'xxx'));
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

  console.log('top country frequencies 1st: ' + sortable[0][0].replace(/\xxx/g, ' ') );
  console.log('top country frequencies 2nd: ' + sortable[1][0].replace(/\xxx/g, ' ') );
  console.log('top country frequencies 3rd: ' + sortable[2][0].replace(/\xxx/g, ' ') );

  $('#first-country').html(sortable[0][0].replace(/\xxx/g, ' '));
  $('#second-country').html(sortable[1][0].replace(/\xxx/g, ' '));
  $('#third-country').html(sortable[2][0].replace(/\xxx/g, ' '));

  // once users have been added from the last 10 minute window then add new live users

});

socket.on('panoptes_classifications', function(userData) {
  // Define Leaflet map icon style for new classifications
  let classificationIcon = makeIcon('static/images/classification-icon.svg');
  addMarker(userData, classificationIcon, MARKER_TIMEOUT_MILLIS, markers);
});

socket.on('panoptes_talk', function(userData) {
  // Define Leaflet map icon style for new talk
  let talkIcon = makeIcon('static/images/talk-icon.svg');
  addMarker(userData, talkIcon, MARKER_TIMEOUT_MILLIS);
  addComment(userData);
});

/*
 * Define Leaflet map and map-related callbacks
 */
function makeIcon(imagePath) {
  return new L.Icon({
    iconUrl: imagePath,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

function addMarker(data, icon, timeout, group) {
  let marker = newMarker(data, icon)

  if (group !== undefined) {
    group.addLayer(marker);
  } else {
    marker.addTo(map);
  }

  if (timeout !== undefined) {
    setTimeout(function () {
      marker.remove();
    }, timeout);
  }
}

function newMarker(data, icon) {
  let text = '';
  if (data.city !== undefined && data.city.length > 0) {
    text += data.city + ", ";
  }
  text += data.country;

  let options = {
    icon: icon,
    title: text,
    alt: text
  };

  return L.marker([data.lat, data.lng], options).bindPopup(text);
}

var mapCenter = [25, 0];
var map = L.map('map', {
  minZoom: 1,
  maxZoom: 12,
  zoom: 2,
  center: mapCenter
});

var markers = L.markerClusterGroup();
map.addLayer(markers);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
