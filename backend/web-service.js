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
    res.render('active-users.njk', {
      title: 'Active Users Live Feed'
    });
  });
};

module.exports.start = start;
