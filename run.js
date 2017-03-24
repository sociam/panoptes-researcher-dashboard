/**
 * Panoptes Researcher Dashboard run script
 * This (compvarely ugly and horrible) script
 */
var express = require('express');
var http = require('http');
var io = require('socket.io');

var env = process.env;
var app = express();
var httpServer = require('http').Server(app);
var io = require('socket.io').listen(httpServer);

// Create and kick off backend server
console.log('Kicking off backend server...');
var backend = require('./backend/server.js');
backend.start(io);

// Create and kick off front-end server
console.log('Kicking off frontend server...');
var opts = {'dotfiles': 'ignore'};

var staticPath = __dirname + env.npm_package_config_static_path;
app.use('/modules', express.static(staticPath));
app.use('/static', express.static(__dirname + '/frontend/static'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/frontend/active-users.html');
});

// Set listening port for HTTP server
httpServer.listen(env.npm_package_config_port);
