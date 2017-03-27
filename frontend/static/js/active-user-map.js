/*
 * Constants; how many comments and classifications to render
 */
var NUM_COMMENTS = 10;
var NUM_CLASSIFICATIONS = 500;
var COMMENT_BOX = '#comment-box';

/*
 * Render each comment data object
 */
function addComments(parentID, dataArr) {
  $(parentID).children().each(function (i, elem) {
    let data = dataArr[i];

    if (data.user.thumbnail) {
      img_url = data.user.thumbnail;
    } else {
      img_url = 'static/images/avatar-small.png';
    }

    // ES6 template string
    elem.innerHTML = `
    <div class="col-sm-10">
      <div class="col-sm-1">
        <div class="thumbnail">
          <a href="${data.user.profile_url}" target="_blank">
            <img class="img-responsive user-photo" src="${img_url}">
          </a>
        </div>
      </div>
      <div class="col-sm-10">
        <div class="panel panel-default">
          <div class="panel-heading">
            <strong><a href="${data.user.profile_url}" target="_blank">${data.user.username}</a></strong>
            <span class="text-muted small">
              (Project ${data.project_id} -
              <a href="${data.project.url}" target="_blank">${data.project.name}</a>)
            </span>
            <span class="text-muted pull-right">Posted on: ${data.created_at}</span>
          </div>
        <div class="panel-body">
          <p>${data.body_html}</p>
          <a class="small text-muted pull-right" href="${data.url}" target="_blank">(Link to thread)</a>
        </div>
      </div>
    </div>`;

    return elem;
  });
}

function showLatestComments(numComments, parentID) {
  $.get('/api/talk/' + numComments, function (data) {
    let talkIcon = makeIcon('static/images/talk-icon.svg');

    // get comments and render HTML
    addComments(parentID, data);
    for (let i = data.length - 1; i >= 0; i-= 1) {

      // draw comment markers on map
      addMarker(data[i], talkIcon, talkMarkers);
    }
  });
}

function showLatestClassifications(numClassifications) {
  $.get('/api/classifications/' + numClassifications, function (data) {
    let classificationIcon = makeIcon('static/images/classification-icon.svg');
    for (let i = 0; i < data.length; i += 1) {
      addMarker(data[i], classificationIcon, classificationMarkers);
    }
  });
}

function tick() {
  // clear previous comments, add comment HTML, draw markers
  let parentID = COMMENT_BOX;
  talkMarkers.clearLayers();
  showLatestComments(10, parentID);

  // add classification markers
  classificationMarkers.clearLayers();
  showLatestClassifications(500);

  // redraw every minute
  window.setTimeout(tick, 1000 * 60);
}

// kick off main loop
$(document).ready(function () {
  // on load, draw the correct number of div elements
  let parentID = COMMENT_BOX;
  for (let i = 0; i < NUM_COMMENTS; i += 1) {
    let elem = document.createElement('div');
    elem.setAttribute('class', 'row');
    $(parentID).append(elem);
  }
  tick();
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

function addMarker(data, icon, group) {
  let marker = newMarker(data, icon);

  if (group !== undefined) {
    group.addLayer(marker);
  } else {
    marker.addTo(map);
  }
}

function newMarker(data, icon) {
  let text = '';
  if (data.geo.city_name !== undefined && data.geo.city_name.length > 0) {
    text += data.geo.city_name + ", ";
  }
  text += data.geo.country_name;

  let options = {
    icon: icon,
    title: text,
    alt: text
  };

  return L.marker([
    data.geo.latitude,
    data.geo.longitude
  ], options).bindPopup(text);
}

var mapCenter = [25, 0];
var map = L.map('map', {
  minZoom: 1,
  maxZoom: 12,
  zoom: 2,
  center: mapCenter
});

var talkMarkers = L.markerClusterGroup({
  disableClusteringAtZoom: 1
});
map.addLayer(talkMarkers);
var classificationMarkers = L.markerClusterGroup();
map.addLayer(classificationMarkers);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="//osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
