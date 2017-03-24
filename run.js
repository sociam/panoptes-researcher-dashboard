/**
 * Panoptes Researcher Dashboard run script
 * Run by invoking 'npm start'
 */
var express = require('express');
var app = express();
var httpServer = require('http').Server(app);
var io = require('socket.io').listen(httpServer);
var env = process.env;

// Set up the templating engine
var njk = require('nunjucks');
njk.configure({
  autoescape: true,
  watch: true
});

var njkEnv = new njk.Environment(
  new njk.FileSystemLoader('frontend/templates')
);
njkEnv.express(app);

// Create and kick off backend server
console.log('Kicking off backend server...');
var backend = require('./backend/server.js');
backend.start(io);

// Create and kick off front-end server
console.log('Kicking off frontend server...');
var staticPath = __dirname.concat(env.npm_package_config_static_path);
app.use('/modules', express.static(staticPath));
app.use('/static', express.static(__dirname + '/frontend/static'));
app.get('/', function (req, res) {
  res.render('active-users.njk', {
    title: 'Active Users Live Feed'
  });
});

// Set listening port for HTTP server
httpServer.listen(env.npm_package_config_port);
