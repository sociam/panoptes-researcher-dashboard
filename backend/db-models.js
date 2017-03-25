var mongoose = require('mongoose');

/*
 * Mongoose requires a schema for a database connection.
 * This is then attached to a collection.
 */
let classificationSchema = new mongoose.Schema({
  source: String,
  status: {
    board_id: Number,
    classification_id: Number,
    created_at: Date,
    geo: {
      country_name: String,
      country_code: String,
      city_name: String,
      coordinates: [Number],
      latitude: Number,
      longitude: Number
    },
    project_id: Number,
    subject_ids: [Number],
    subject_urls: [{
      'image/jpeg': String
    }],
    user_id: Number,
    workflow_id: Number
  }
});

let talkSchema = new mongoose.Schema({
  source: String,
  status: {
    board_id: Number,
    body: String,
    created_at: Date,
    discussion_id: Number,
    id: Number,
    geo: {
      country_name: String,
      country_code: String,
      city_name: String,
      coordinates: [Number],
      latitude: Number,
      longitude: Number
    },
    focus_id: Number,
    focus_type: String,
    project_id: Number,
    section: String,
    url: String,
    user: {
      login: String,
      profile: String,
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
