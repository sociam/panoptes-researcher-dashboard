/**
 * Panoptes Researcher Dashboard run script
 * This (completely ugly and horrible) script
 */
var connect = require('connect');
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
var staticContent = serveStatic(FRONTEND_PATH);
connect().use(staticContent).listen(FRONTEND_HTTP_PORT);
