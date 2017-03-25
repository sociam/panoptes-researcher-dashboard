var mongoose = require('mongoose');
var models = require('./db-models.js');

function parsePositiveInteger(param, defaultValue) {
  let x = parseInt(param);
  if (x && x > 0) {
    return x;
  } else {
    return defaultValue;
  }
}

function oneHourAgo() {
  return new Date(new Date().getTime() - (1000 * 60 * 60));
}

function flattenObjects(arr) {
  let newArr = [];
  for (let i = 0; i < arr.length; i += 1) {
    newArr.push(arr[i].status);
  }
  return newArr;
}

function recent(model, since, howMany, callback) {
  model.aggregate([
    { $match: {
      'status.created_at': {
        $gt: since
      }
    }},
    { $sort: { 'status.created_at': -1 } },
    { $limit: howMany }
  ], function (err, res) {
    if (err) {
      throw err;
    }
    callback(flattenObjects(res));
  });
}

function popularImages(model, since, howMany, callback) {
  model.aggregate([
    { $match: {
      'status.created_at': {
        $gt: since
      }
    }},
    { $unwind: '$status.subject_urls' },
    {
      $group: {
        _id: '$status.subject_urls.image/jpeg',
        count: { $sum: 1 }
      }
    },
    { $sort: { 'count': -1} },
    { $match: { '_id': { $ne: null } } },
    { $limit: howMany }
  ], function (err, res) {
    if (err) {
      throw err;
    }

    callback(flattenObjects(res));
  });
}

function start(db, app) {
  let mdls = models(db);

  // set up app routes
  app.get('/api/talk/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let callback = (result) => res.send(result);
    recent(mdls.talk.model, oneHourAgo(), numResults, callback);
  });

  app.get('/api/classifications/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 100);
    let callback = (result) => res.send(result);
    recent(mdls.classification.model, oneHourAgo(), numResults, callback);
  });

  app.get('/api/images/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let callback = (result) => res.send(result);
    popularImages(mdls.classification.model, oneHourAgo(), numResults, callback);
  });
}

module.exports.start = start;
