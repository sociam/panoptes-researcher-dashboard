let numImages = 19;
let oneMinute = 60 * 1000;
let projectFilter = -1;

function buildImageWall(numImages) {
  let url = '/api/images/commented/' + numImages;
  if (projectFilter >= 0) {
    url += '/' + projectFilter;
  }

  $.get(url, function (data) {
    let html = '';
    for (let i = 0; i < data.length; i += 1) {
      let w = 200 + (100 * (4 * Math.log(data[i].count)) * Math.random()) << 0;

      let imgURL = data[i].images[0];
      let threadURL = data[i].thread_url.split('?')[0];
      let url = data[i].project.url;

      // ES6 template string
      let temp = `
        <div class="cell" style="width: ${w}px; background-image: url(${imgURL})">
        <div class="overlay">
        <span class="overlay-text">
        <a href="${url}" target="_blank">
        ${data[i].project.name}
      </a>
        </span>
        <br/>
        <span class="overlay-text fifteen">
        Project ID: ${data[i].project_id}
      </span>
        <br/>
        <span class="overlay-text fifteen">
        <a href="${threadURL}" target="_blank">
        Comments: ${data[i].count}
      </a>
        </span>
        </div>
        </div>`;
      html += temp;
    }

    $('#freewall').html(html);
    let wall = new Freewall('#freewall');

    wall.reset({
      selector: '.cell',
      animate: true,
      cellW: 20,
      cellH: 200,
      onResize: function() {
        wall.fitWidth();
      }
    });

    wall.fitWidth();

    $(window).trigger('resize');
  });
}

function tick() {
  buildImageWall(numImages);
  setTimeout(tick, oneMinute);
}

function parseProjectID(value) {
  if (value !== undefined && value.length > 0) {
    try {
      let projectID = parseInt(value);
      return projectID >= 0 ? projectID : -1;
    } catch (e) {
      console.error(e);
    }
  }
  return -1;
}

$(document).ready(function () {
  tick();
});

$('#project-filter-form').on('submit', function (e) {
  projectFilter = parseProjectID($('#project-filter').val());
  buildImageWall(numImages);
  e.preventDefault();
});
