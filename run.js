/**
 * Panoptes Researcher Dashboard run script
 * This (completely ugly and horrible) script
 */
var finalHandler = require('finalhandler');
var http = require('http')
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');

let BACKEND_HTTP_PORT = 3005;
let FRONTEND_HTTP_PORT = 8080;
let FRONTEND_PATH = __dirname.concat('/frontend');

console.log(FRONTEND_PATH);

// Create and kick off backend server
console.log('Kicking off backend server...');
let backend = require('./backend/server.js');
backend.start(BACKEND_HTTP_PORT);

// Create and kick off front-end server
console.log('Kicking off frontend server...');
let opts = {'dotfiles': 'ignore'};

let _static = serveStatic(FRONTEND_PATH);
let _index = serveIndex(FRONTEND_PATH);
let srv = http.createServer(function onRequest(req, res) {
  let done = finalHandler(req, res);
  _static(req, res, function onNext(err) {
    if (err) {
      console.log(err);
    }

    _index(req, res, done);
  });
});
srv.listen(FRONTEND_HTTP_PORT);
