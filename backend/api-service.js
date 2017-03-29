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

function query(model, pipeline, callback, filter) {
  if (filter) {
    pipeline.unshift(filter);
  }

  model.aggregate(pipeline, function (err, res) {
    if (err) {
      throw err;
    }
    callback(res);
  });
}

function recent(model, howMany, callback, filter) {
  let pipeline = [
    { $sort: { 'status.created_at': -1 } },
    { $limit: howMany }
  ];

  let matchFilter = null;
  if (filter && filter > 0) {
    matchFilter = { $match: { 'status.project_id': filter } };
  }

  query(model, pipeline, callback, matchFilter);
}

function mostClassifiedImages(model, howMany, callback, filter) {
  let pipeline = [
    { $lookup: {
      from: 'projects',
      localField: 'status.project_id',
      foreignField: 'status.id',
      as: 'projects' } },
    { $sort: { 'status.created_at': -1 } },
    { $unwind: '$status.subject_urls' },
    {
      $group: {
        _id: '$status.subject_urls',
        count: { $sum: 1 },
        project_id: { $first: '$status.project_id' },
        projects: { $first: '$projects' }
      }
    },
    { $sort: { 'count': -1 } },
    { $match: { '_id': { $ne: null } } },
    { $limit: howMany },
    { $project: {
      '_id': false,
      count: '$count',
      url: '$_id',
      projects: '$projects',
      project_id: '$project_id'
    } }
  ];

  let matchFilter = null;
  if (filter && filter > 0) {
    matchFilter = { $match: { 'status.project_id': filter } };
  }

  query(model, pipeline, callback, matchFilter);
}

function mostCommentedImages(model, howMany, callback, filter) {
  let pipeline = [
    { $lookup: {
      from: 'projects',
      localField: 'status.project_id',
      foreignField: 'status.id',
      as: 'projects' } },
      { $sort: { 'status.created_at': -1 } },
      {
        $group: {
          _id: '$status.focus_id',
          count: { $sum: 1 },
          projects: { $first: '$projects' },
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
        project: '$projects',
        project_id: '$project_id',
        subject_id: '$_id',
        thread_url: '$thread_url',
        images: '$images',
      }
    }
  ];

  let matchFilter = null;
  if (filter && filter > 0) {
    matchFilter = { $match: { 'status.project_id': filter } };
  }

  query(model, pipeline, callback, matchFilter);
}

function start(db, app) {
  let mdls = models(db);

  // set up app routes
  app.get('/api/talk/:num/:filter*?', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let filter = parsePositiveInteger(req.params.filter, undefined);
    let callback = (result) => res.send(result);
    recent(mdls.talk.model, numResults, callback, filter);
  });

  app.get('/api/classifications/:num/:filter*?', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 100);
    let filter = parsePositiveInteger(req.params.filter, undefined);
    let callback = (result) => res.send(result);
    recent(mdls.classification.model, numResults, callback, filter);
  });

  app.get('/api/images/classified/:num/:filter*?', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let filter = parsePositiveInteger(req.params.filter, undefined);
    let callback = (result) => res.send(result);
    mostClassifiedImages(mdls.classification.model, numResults, callback, filter);
  });

  app.get('/api/images/commented/:num/:filter*?', function (req, res) {
    let numResults = parsePositiveInteger(req.params.num, 10);
    let filter = parsePositiveInteger(req.params.filter, undefined);
    let callback = (result) => res.send(result);
    mostCommentedImages(mdls.talk.model, numResults, callback, filter);
  });
}

module.exports.start = start;
