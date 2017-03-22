/**
 * Panoptes Researcher Dashboard run script
 * This (compvarely ugly and horrible) script
 */
var finalHandler = require('finalhandler');
var http = require('http')
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');
var env = process.env;


// Create and kick off backend server
console.log('Kicking off backend server...');
var backend = require('./backend/server.js');
backend.start(env.npm_package_config_backend_port);

// Create and kick off front-end server
console.log('Kicking off frontend server...');
var opts = {'dotfiles': 'ignore'};

var _static = serveStatic(env.npm_package_config_frontend_static_path);
var _index = serveIndex(env.npm_package_config_frontend_static_path);

var srv = http.createServer(function onRequest(req, res) {
  let done = finalHandler(req, res);
  _static(req, res, function onNext(err) {
    if (err) {
      console.log(err);
    }
    _index(req, res, done);
  });
});

srv.listen(env.npm_package_config_frontend_port);
