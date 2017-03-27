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

function flattenObjects(arr) {
  let newArr = [];
  for (let i = 0; i < arr.length; i += 1) {
    newArr.push(arr[i].status);
  }
  return newArr;
}

function recent(model, howMany, callback) {
  model.aggregate([
    { $sort: { 'status.created_at': -1 } },
    { $limit: howMany }
  ], function (err, res) {
    if (err) {
      throw err;
    }
    callback(flattenObjects(res));
  });
}

function popularImages(model, howMany, callback) {
  model.aggregate([
    { $sort: { 'status.created_at': -1 } },
    { $unwind: '$status.subject_urls' },
    {
      $group: {
        _id: '$status.subject_urls',
        count: { $sum: 1 },
        name: { $first: '$status.project.name' },
        slug: { $first: '$status.project.slug' },
        url: { $first: '$status.project.url' },
        project_id: { $first: '$status.project_id' }
      }
    },
    { $sort: { 'count': -1 } },
    { $match: { '_id': { $ne: null } } },
    { $limit: howMany },
    { $project: {
      '_id': false,
      count: '$count',
      url: '$_id',
      project: {
        name: '$name',
        slug: '$slug',
        url: '$url',
      },
      project_id: '$project_id'
    } }
  ], function (err, res) {
    if (err) {
      throw err;
    }

    callback(res);
  });
}

function mostCommentedImages(model, howMany, callback) {
  model.aggregate([
      { $sort: { 'status.created_at': -1 } },
      {
        $group: {
          _id: '$status.focus_id',
          count: { $sum: 1 },
          project: { $first: '$status.project' },
          project_id: { $first: '$status.project_id' },
          thread_url: { $first: '$status.url' },
          images: { $first: '$status.subject.images' }
        }
      },
      { $sort: { 'count': -1 } },
      { $match: { '_id': { $ne: null } } },
      { $limit: howMany },
      { $project: {
        count: '$count',
        '_id': false,
        project: '$project',
        project_id: '$project_id',
        subject_id: '$_id',
        thread_url: '$thread_url',
        images: '$images',
      }
    }
  ], function (err, subjects) {
    if (err) {
      throw err;
    }

    callback(subjects);
  });
}

function start(db, app) {
  let mdls = models(db);

  // set up app routes
  app.get('/api/talk/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let callback = (result) => res.send(result);
    recent(mdls.talk.model, numResults, callback);
  });

  app.get('/api/classifications/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 100);
    let callback = (result) => res.send(result);
    recent(mdls.classification.model, numResults, callback);
  });

  app.get('/api/images/classified/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let callback = (result) => res.send(result);
    popularImages(mdls.classification.model, numResults, callback);
  });

  app.get('/api/images/commented/:num', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let callback = (result) => res.send(result);
    mostCommentedImages(mdls.talk.model, numResults, callback);
  });
}

module.exports.start = start;
