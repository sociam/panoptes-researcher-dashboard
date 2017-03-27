let numImages = 20;

function getThumbURL(imgURL) {
  let components = imgURL.split('/');
  let filename = components[components.length - 1];
  let thumbURL = 'https://thumbnails.zooniverse.org/400x400/panoptes-uploads.zooniverse.org/production/subject_location/' + filename;

  return thumbURL;
}

$(document).ready(function () {
  $.get('/api/images/classified/' + numImages, function (data) {
    let html = '';
    for (var i = 0; i < data.length; i += 1) {
      let w = 200 + (100 * Math.log(data[i].count) * Math.random()) << 0
      let imgURL = getThumbURL(data[i].url);
      let url = data[i].project.url;

      // ES6 template string
      let temp = `
        <div class="cell" style="width: ${w}px; background-image: url(${imgURL})">
            <div class="overlay">
              <span class="overlay-text">
                <a href="${url}", target="_blank">
                  ${data[i].project.title}
                </a>
              </span>
              <br />
              <span class="overlay-text fifteen">
                Activity: ${data[i].count}
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
});
