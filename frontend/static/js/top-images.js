let numImages = 19;
let oneMinute = 60 * 1000;
let projectFilter = -1;

function buildImageWall(numImages) {
  let url = '/api/images/commented/' + numImages;
  if (projectFilter >= 0) {
    url += '/' + projectFilter;
  }

  g$.get(url, function (data) {
    let html = '';
    for (let i = 0; i < data.length; i += 1) {
      let w = 250 + (125 * (4 * Math.log(data[i].count)) * Math.random()) << 0;

      let imgURL = data[i].images[0];
      let threadURL = data[i].thread_url.split('?')[0];
      let url = data[i].project.url;

      // ES6 template string
      let temp = `
        <div class="cell" style="width: ${w}px; background-image: url(${imgURL})">
          <span class="glyphicon glyphicon-ok-circle tick pull-right"></span>
          <div class="overlay">
            <br/>
            <div class="overlay-text">
              <a href="${url}" target="_blank">
                ${data[i].project.name}
              </a>

              <br/>
              <span class="fifteen">
                Project ID: ${data[i].project_id}
                </br>
                <a href="${threadURL}" target="_blank">
                  Comments: ${data[i].count}
                </a>
              </span>
            </div>
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
    setViewedStatus();
  });
}

function setVisibilityListeners() {
  $('#freewall').on('click', 'a[href*="/talk/"]', function(event) {
    const clickedUrl = $(this).attr('href');
    const viewedUrls = JSON.parse(localStorage.getItem('viewedUrls')) || [];
    viewedUrls.push(clickedUrl);
    localStorage.setItem('viewedUrls', JSON.stringify(viewedUrls));
    setViewedStatus();
  });
}

function setViewedStatus() {
  const viewedUrls = JSON.parse(localStorage.getItem('viewedUrls'));
  if (viewedUrls && viewedUrls.length) {
    const wall = $('#freewall');
    viewedUrls.forEach(url => {
      const urlCell = wall.find(`a[href="${url}"]`).closest('.cell');
      const icon = urlCell.children('.glyphicon');
      icon.css({ visibility: 'visible' });
    });
  }
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
  setVisibilityListeners();
});

$('#project-filter-form').on('submit', function (e) {
  projectFilter = parseProjectID($('#project-filter').val());
  buildImageWall(numImages);
  e.preventDefault();
});
