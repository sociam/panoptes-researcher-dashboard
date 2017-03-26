let numImages = 20;

$(document).ready(function () {
  $.get('/api/images/' + numImages, function (data) {
    let html = '';
    for (var i = 0; i < data.length; i += 1) {
      let w = 150 + (200 * Math.log10(data[i].count) << 0);
      let url = data[i].url;

      // ES6 template string
      let temp = `<a href="${url}">
          <div class="cell" style="width: ${w}px; background-image: url(${url})">
            <div class="overlay">
              <span class="overlay-text">${data[i].count}</span>
            </div>
          </div>
        </a>`;
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
