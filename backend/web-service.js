var express = require('express');
var njk = require('nunjucks');

// configure the templating engine
njk.configure({
  autoescape: true,
  watch: true
});

function start(app, paths) {
  // set up template path, configure app
  let fsl = new njk.FileSystemLoader(paths.templates);
  let njkEnv = new njk.Environment(fsl);
  njkEnv.express(app);

  // set up static paths
  app.use('/modules', express.static(paths.module));
  app.use('/static', express.static(paths.static));

  // set up web interface routes
  app.get('/', function (req, res) {
    res.render('index.njk', {
      title: 'Panoptes Researcher Dashboard'
    });
  });

  app.get('/live', function (req, res) {
    res.render('live-feed.njk', {
      title: 'Live Users and Comments'
    });
  });

  app.get('/trending', function (req, res) {
    res.send('Page does not exist yet :-(');
  });

  app.get('/images', function (req, res) {
    res.render('top-images.njk', {
      title: 'Popular Images'
    });
  });
};

module.exports.start = start;
