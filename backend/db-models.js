var mongoose = require('mongoose');

let oneHour = 1 * 60 * 60;

let createdAtInfo = {
  type: Date,
  expires: null,
  default: Date.now
};

let geoInfo = {
  country_name: String,
  country_code: String,
  city_name: String,
  coordinates: [Number],
  latitude: Number,
  longitude: Number
};


/*
 * Mongoose requires a schema for a database connection.
 * This is then attached to a collection.
 */
let classificationSchema = new mongoose.Schema({
  source: String,
  status: {
    board_id: Number,
    classification_id: {
      type: Number,
      unique: true
    },
    created_at: createdAtInfo,
    geo: geoInfo,
    project_id: Number,
    subject_ids: [Number],
    subject_urls: [String],
    user_id: Number,
    workflow_id: Number
  }
});

let projectSchema = new mongoose.Schema({
  source: String,
  status: {
    id: {
      type: Number,
      unique: true
    },
    created_at: createdAtInfo,
    name: String,
    slug: String,
    url: String
  }
});

let talkSchema = new mongoose.Schema({
  source: String,
  status: {
    id: {
      type: Number,
      unique: true
    },
    board_id: Number,
    body: String,
    body_html: String,
    created_at: createdAtInfo,
    discussion_id: Number,
    geo: geoInfo,
    focus_id: Number,
    focus_type: String,
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

module.exports = function (db) {
  return {
    classification: {
      schema: classificationSchema,
      model: db.model('classifications', classificationSchema)
    },
    talk: {
      schema: talkSchema,
      model: db.model('talks', talkSchema)
    },
    project: {
      schema: projectSchema,
      model: db.model('projects', projectSchema)
    }
  };
}
