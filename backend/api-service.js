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
        _id: '$status.subject_urls.image/jpeg',
        count: { $sum: 1 },
        name: { $first: '$status.project.name' },
        slug: { $first: '$status.project.slug' },
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
        title: '$name',
        slug: '$slug'
      }
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
          count: { $sum: 1 }
        }
      },
      { $sort: { 'count': -1 } },
      { $match: { '_id': { $ne: null } } },
      { $limit: howMany },
      { $project: {
        '_id': false,
        subject_id: '$_id',
        count: '$count'
      }
    }
  ], function (err, subjects) {
    if (err) {
      throw err;
    }

    for (let i = 0; i < subjects.length; i += 1) {
      model.find({'status.focus_id': subjects[i].subject_id},
        function (req, res) {
          subjects[i].comments = res;
          if (i == subjects.length - 1) {
            callback(subjects);
          }
        }
      );
    }
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
