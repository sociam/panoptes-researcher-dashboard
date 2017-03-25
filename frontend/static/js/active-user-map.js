MARKER_TIMEOUT_MILLIS = 5 * 60 * 1000;  // 5 minutes

/*
 * Render each comment data object
 */
function addComment(parent_elem, data) {
  if (data.thumbnail) {
    img_url = data.thumbnail;
  } else {
    img_url = 'static/images/avatar-small.png';
  }

  if (data.login) {
    profile_url = 'https://www.zooniverse.org/users/' + data.login;
  } else {
    profile_url = '#';
  }

  $(parent_elem).prepend(function () {
    let elem = document.createElement('div');

    // ES6 template string
    elem.innerHTML = `
    <div class="row">
      <div class="col-sm-10">
        <div class="col-sm-1">
          <div class="thumbnail">
            <a href="${profile_url}" target="_blank">
              <img class="img-responsive user-photo" src="${img_url}">
            </a>
          </div>
        </div>
        <div class="col-sm-10">
          <div class="panel panel-default">
            <div class="panel-heading">
              <strong><a href="${profile_url}" target="_blank">${data.username}</a></strong>
              <span class="text-muted small">(On project: <a href="${data.url}" target="_blank">${data.project_id}</a>)</span>
              <span class="text-muted pull-right">Posted on: ${data.timestamp}</span>
            </div>
          <div class="panel-body">
            <p>${data.body}</p>
            <a class="small text-muted pull-right" href="${data.url}" target="_blank">(Link to thread)</a>
          </div>
        </div>
      </div>
    </div>`;

    return elem;
  });
}

var commentsOrderByDate = [];
var usersOrderByDate = [];
var socket = io.connect('//');
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
});

socket.on('panoptes_classifications', function(userData) {
  // Define Leaflet map icon style for new classifications
  let classificationIcon = makeIcon('static/images/classification-icon.svg');
  addMarker(userData, classificationIcon, MARKER_TIMEOUT_MILLIS, markers);
});

socket.on('panoptes_talk', function(userData) {
  // Define Leaflet map icon style for new talk
  let talkIcon = makeIcon('static/images/talk-icon.svg');

  addMarker(userData.latest, talkIcon, MARKER_TIMEOUT_MILLIS);

  // clear previous comments, render new ones
  let parent_id = '#comment-box';
  $(parent_id).empty();

  for (let i = 0; i < userData.recent.length; i += 1) {
    addComment(parent_id, userData.recent[i]);
  }
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
  attribution: '&copy; <a href="//osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
