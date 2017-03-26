# Panoptes Researcher Dashboard

A dashboard for the researchers running projects on the Zooniverse Panoptes
Citizen Science platform.

## Software Design

The software is constructed out of several (sort-of) microservices;

* A data interface layer that listens to events on the Zooniverse platform and
  streams them into a MongoDB database.
* An API that provides some REST-esque endpoints that gives the application
  programmatic access to certain structured data in the database.
* A small web application framework that generates and serves the dashboard's
  HTML pages from templates.

### Data interface layer

This simply subscribes to some Pusher streams and then transforms the data into
a sensible format before indexing it into a MongoDB database.

### Backend API

The backend API is quite straightforward, and just performs queries on data in
the database, which can then be shuttled to the web interface or other
frameworks.

### Web application framework

The application is written entirely in Node.JS and uses the Express web
framework to serve requests. It uses the `nunjucks` templating engine, which is
essentially a Node.JS clone of Python's Jinja2.

## Pages

### Live users and comments

Shows real-time geographic activity of users on the platform, plus a list of
live-streaming comments, users, etc.

### Popular images

Shows a real-time display of the most popular images - that is, images with the
highest overall activity from users (comments and so forth).
