/**
 * Panoptes Researcher Dashboard run script
 * Run by invoking 'npm start'
 */
var express = require('express');
var app = express();
var httpServer = require('http').Server(app);
var mongoose = require('mongoose');
var env = process.env;

// stop stupid mongoose warnings
mongoose.Promise = global.Promise;

// Fetch configuration variables from package.json, or use sensible defaults
let makePath = (p) => __dirname + '/' + p;
let httpPort = env.npm_package_config_port || 8080;
let mongo = {
  'host': env.npm_package_config_mongo_host || 'localhost',
  'db': env.npm_package_config_mongo_db || 'zoo_panoptes'
};
let mongoURL = 'mongodb://' + mongo.host + '/' + mongo.db;
let paths = {
  'module': makePath(env.npm_package_config_paths_modules || 'node_modules'),
  'static': makePath(env.npm_package_config_paths_static || 'frontend/static'),
  'templates': makePath(env.npm_package_config_paths_templates || 'frontend/templates')
};
let pusherSocket = env.npm_package_pusher_socket || '79e8e05ea522377ba6db';

// Create MongoDB connection
let db = mongoose.createConnection(mongoURL);

// Create and kick off data service
console.log('Kicking off data service...');
var dataService = require('./backend/data-service.js');
dataService.start(db, mongo, pusherSocket);

// Create and kick off API service
console.log('Kicking off API service...');
var apiService = require('./backend/api-service.js');
apiService.start(db, app);

// Create and kick off web service
console.log('Kicking off web service...');
var webService = require('./backend/web-service.js');
webService.start(app, paths);

// Set listening port for HTTP server
httpServer.listen(httpPort);
