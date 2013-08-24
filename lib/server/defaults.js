(function() {
  var check, convict, defaults, environment, m, redisUrl;

  convict = require('convict');

  check = require('validator').check;

  defaults = convict({
    env: {
      doc: 'The application environment',
      format: ['production', 'development', 'test'],
      "default": 'development',
      env: 'NODE_ENV'
    },
    redis: {
      doc: 'A node_redis configuration object',
      port: {
        format: 'port',
        "default": '6379',
        env: 'REDIS_PORT'
      },
      host: {
        "default": '127.0.0.1',
        env: 'REDIS_HOST'
      },
      password: {
        doc: 'Redis is fast. Not worth setting a short password',
        format: function(val) {
          if (val != null) {
            return check(val).len(16);
          }
        },
        "default": void 0,
        env: 'REDIS_PASSWORD'
      },
      db: {
        format: 'int',
        "default": 1,
        env: 'REDIS_DB'
      }
    },
    mongo: {
      url: {
        format: function(val) {
          return check(val).notEmpty().regex(/^mongodb\:\/\//i);
        },
        "default": void 0,
        env: ['MONGO_URL', 'MONGOHQ_URL']
      },
      host: {
        "default": 'localhost',
        env: 'MONGO_HOST'
      },
      port: {
        format: 'port',
        "default": '27017',
        env: 'MONGO_PORT'
      },
      prefix: {
        doc: 'The database prefix. Not necessary if `url` is set.',
        "default": 'auth-',
        env: 'MONGO_PREFIX'
      }
    },
    mailer: {
      type: {
        doc: 'The Nodemailer transport type',
        "default": 'SMTP'
      },
      options: {
        doc: 'A Nodemailer options object',
        service: {
          format: ['DynectEmail', 'Gmail', 'hot.ee', 'Hotmail', 'iCloud', 'mail.ee', 'Mail.Ru', 'Mailgun', 'Mailjet', 'Mandrill', 'Postmark', 'QQ', 'SendGrid', 'SES', 'Yahoo', 'yandex', 'Zoho'],
          "default": void 0,
          env: 'SMTP_SERVICE'
        },
        auth: {
          user: {
            format: 'email',
            "default": void 0,
            env: 'SMTP_USERNAME'
          },
          pass: {
            format: String,
            "default": void 0,
            env: 'SMTP_PASSWORD'
          }
        },
        host: {
          format: String,
          "default": void 0,
          env: 'SMTP_HOST'
        },
        port: {
          format: 'port',
          "default": void 0,
          env: 'SMTP_PORT'
        }
      }
    },
    session: {
      secret: {
        doc: 'The secret used to sign the session cookie',
        "default": void 0,
        format: function(val) {
          return check(val).notEmpty().len(16);
        },
        env: 'SESSION_SECRET'
      }
    }
  });

  if (process.env.REDISCLOUD_URL) {
    redisUrl = require('url').parse(process.env.REDISCLOUD_URL);
    defaults.load({
      redis: {
        host: redisUrl.hostname,
        port: redisUrl.port,
        password: redisUrl.auth.split(':')[1]
      }
    });
  }

  environment = defaults.get('env');

  m = defaults.get('mongo');

  switch (environment) {
    case 'development':
      defaults.load({
        mongo: {
          url: "mongodb://" + m.host + ":" + m.port + "/" + m.prefix + "development"
        }
      });
      break;
    case 'test':
      defaults.load({
        mongo: {
          url: "mongodb://" + m.host + ":" + m.port + "/" + m.prefix + "test"
        }
      });
      break;
    case 'test':
      defaults.load({
        mongo: {
          url: "mongodb://" + m.host + ":" + m.port + "/" + m.prefix + "production"
        }
      });
  }

  if (environment !== 'production') {
    defaults.load({
      session: {
        secret: 'USE A REAL SECRET WHEN YOU DEPLOY'
      }
    });
  }

  defaults.validate();

  if (environment === 'development') {
    defaults.load({
      mailer: {
        options: {
          auth: {
            user: '',
            pass: ''
          },
          port: 1025,
          ignoreTLS: true
        }
      }
    });
  }

  module.exports = defaults;

}).call(this);
