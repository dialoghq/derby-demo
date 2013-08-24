convict = require('convict')
check   = require('validator').check

defaults = convict(
  env:
    doc: 'The application environment'
    format: ['production', 'development', 'test']
    default: 'development'
    env: 'NODE_ENV'

  redis:
    doc: 'A node_redis configuration object'
    port:
      format: 'port'
      default: '6379'
      env: 'REDIS_PORT'
    host:
      default: '127.0.0.1'
      env: 'REDIS_HOST'
    password:
      doc: 'Redis is fast. Not worth setting a short password'
      format: (val) -> check(val).len(16) if val?
      default: undefined
      env: 'REDIS_PASSWORD'
    db:
      format: 'int'
      default: 1
      env: 'REDIS_DB'

  mongo:
    url:
      format: (val) -> check(val).notEmpty().regex /^mongodb\:\/\//i
      default: undefined
      env: ['MONGO_URL', 'MONGOHQ_URL']
    host:
      default: 'localhost'
      env: 'MONGO_HOST'
    port:
      format: 'port'
      default: '27017'
      env: 'MONGO_PORT'
    prefix:
      doc: 'The database prefix. Not necessary if `url` is set.'
      default: 'auth-'
      env: 'MONGO_PREFIX'

  mailer:
    type:
      doc: 'The Nodemailer transport type'
      default: 'SMTP'
    options:
      doc: 'A Nodemailer options object'
      service:
        format: [
          'DynectEmail', 'Gmail', 'hot.ee', 'Hotmail',
          'iCloud', 'mail.ee', 'Mail.Ru', 'Mailgun',
          'Mailjet', 'Mandrill', 'Postmark', 'QQ',
          'SendGrid', 'SES', 'Yahoo', 'yandex', 'Zoho'
        ]
        default: undefined
        env: 'SMTP_SERVICE'
      auth:
        user:
          format: 'email'
          default: undefined
          env: 'SMTP_USERNAME'
        pass:
          format: String
          default: undefined
          env: 'SMTP_PASSWORD'
      host:
        format: String
        default: undefined
        env: 'SMTP_HOST'
      port:
        format: 'port'
        default: undefined
        env: 'SMTP_PORT'

  session:
    secret:
      doc: 'The secret used to sign the session cookie'
      default: undefined
      format: (val) -> check(val).notEmpty().len(16)
      env: 'SESSION_SECRET'
)

# Unfortunately the Redis Cloud url must be parsed to be usable
if process.env.REDISCLOUD_URL
  redisUrl = require('url').parse process.env.REDISCLOUD_URL
  defaults.load( redis:
    host: redisUrl.hostname
    port: redisUrl.port
    password: redisUrl.auth.split(':')[1] )

environment = defaults.get('env')

# Multiple environments should run on localhost without colliding
m = defaults.get('mongo')
switch environment
  when 'development'
    defaults.load( mongo:
      url: "mongodb://#{m.host}:#{m.port}/#{m.prefix}development" )
  when 'test'
    defaults.load( mongo:
      url: "mongodb://#{m.host}:#{m.port}/#{m.prefix}test" )
  when 'test'
    defaults.load( mongo:
      url: "mongodb://#{m.host}:#{m.port}/#{m.prefix}production" )

# The app should only require a real cookie secret in production
unless environment is 'production'
  defaults.load ( session:
    secret: 'USE A REAL SECRET WHEN YOU DEPLOY' )

defaults.validate()

# Use MailCatcher locally
if environment is 'development'
  defaults.load( mailer:
    options:
      auth:
        user: ''
        pass: ''
      port: 1025
      ignoreTLS: true )

module.exports = defaults

