var express = require('express');
var derby = require('derby');
var racerBrowserChannel = require('racer-browserchannel');
var liveDbMongo = require('livedb-mongo');
var MongoStore = require('connect-mongo')(express);
var app = require('../app');
var error = require('./error');
var config = require('./defaults');

var expressApp = module.exports = express();

// Get Redis configuration
var redis = require('redis').createClient(
  config.get('redis.port'),
  config.get('redis.host')
);
if ( config.get('redis.password') !== undefined ) {
  redis.auth = config.get('redis.password');
}
redis.select( config.get('redis.db') );

var mailer = require('nodemailer').createTransport(
  config.get('mailer.type'),
  config.get('mailer.options')
);

// The store creates models and syncs data
var store = derby.createStore({
  db: liveDbMongo(config.get('mongo.url') + '?auto_reconnect', {safe: true})
, redis: redis
});

function createUserId(req, res, next) {
  var model = req.getModel();
  if (req.session.userId === null || req.session.userId === undefined) {
    req.session.userId = model.id();
  }
  model.set('_session.userId', req.session.userId);
  next();
}

expressApp
  .use(express.favicon())
  // Gzip dynamically
  .use(express.compress())
  // Respond to requests for application script bundles
  .use(app.scripts(store))
  // Serve static files from the public directory
  // .use(express.static(__dirname + '/../../public'))

  // Add browserchannel client-side scripts to model bundles created by store,
  // and return middleware for responding to remote client messages
  .use(racerBrowserChannel(store))
  // Add req.getModel() method
  .use(store.modelMiddleware())

  // Parse form data
  // .use(express.bodyParser())
  // .use(express.methodOverride())

  // Session middleware
  .use(express.cookieParser())
  .use(express.session({
    secret: config.get('session.secret')
  , store: new MongoStore({url: config.get('mongo.url'), safe: true})
  }))
  .use(createUserId)

  // Create an express middleware from the app's routes
  .use(app.router())
  .use(expressApp.router)
  .use(error());


// SERVER-SIDE ROUTES //

expressApp.all('*', function(req, res, next) {
  next('404: ' + req.url);
});
