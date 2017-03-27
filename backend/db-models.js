var mongoose = require('mongoose');

let oneHour = 1 * 60 * 60;

let createdAtInfo = {
  type: Date,
  expires: oneHour
};

let geoInfo = {
  country_name: String,
  country_code: String,
  city_name: String,
  coordinates: [Number],
  latitude: Number,
  longitude: Number
};

let projectInfo = {
  name: String,
  slug: String,
  url: String
};

/*
 * Mongoose requires a schema for a database connection.
 * This is then attached to a collection.
 */
let classificationSchema = new mongoose.Schema({
  source: String,
  status: {
    board_id: Number,
    classification_id: Number,
    created_at: createdAtInfo,
    geo: geoInfo,
    project: projectInfo,
    project_id: Number,
    subject_ids: [Number],
    subject_urls: [String],
    user_id: Number,
    workflow_id: Number
  }
});

let talkSchema = new mongoose.Schema({
  source: String,
  status: {
    board_id: Number,
    body: String,
    body_html: String,
    created_at: createdAtInfo,
    discussion_id: Number,
    id: Number,
    geo: geoInfo,
    focus_id: Number,
    focus_type: String,
    project: projectInfo,
    project_id: Number,
    section: String,
    subject: {
      images: [String],
      created_at: Date
    },
    url: String,
    user: {
      login: String,
      profile_url: String,
      thumbnail: String,
      username: String
    }
  }
});

function talkModel(db) {
  return db.model('talk', talkSchema);
}

function classificationModel(db) {
  return db.model('classifications', classificationSchema);
}

module.exports = function (db) {
  return {
    classification: {
      schema: classificationSchema,
      model: classificationModel(db)
    },
    talk: {
      schema: talkSchema,
      model: talkModel(db)
    }
  };
}
