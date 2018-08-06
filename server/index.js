const path = require('path')
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const session = require('express-session')
const passport = require('passport')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const db = require('./db')
const sessionStore = new SequelizeStore({db})
const PORT = process.env.PORT || 8080
const app = express()
const websocket = require('websocket')
const WebSocketServer = websocket.server;
const websocketSetup = require('./socket')
//websocketSetup
//const socketio = require('socket.io')
//const socketShort = require('./socket')
//const ws = require('express-ws')
//const expressWs = require('express-ws')(app)
//const WebSocket = require('ws')
//const ws = require('ws')
//const WebSocketServer = ws.Server

module.exports = app

/**
 * In your development environment, you can keep all of your
 * app's secret API keys in a file called `secrets.js`, in your project
 * root. This file is included in the .gitignore - it will NOT be tracked
 * or show up on Github. On your production server, you can add these
 * keys as environment variables, so that they can still be read by the
 * Node process on process.env
 */
if (process.env.NODE_ENV !== 'production') require('../secrets')


// passport registration
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) =>
  db.models.user.findById(id)
    .then(user => done(null, user))
    .catch(done))

const createApp = () => {
  // logging middleware
  app.use(morgan('dev'))

  // body parsing middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // compression middleware
  app.use(compression())

  // session middleware with passport
  app.use(session({
    secret: process.env.SESSION_SECRET || 'my best friend is Cody',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  // auth and api routes
  app.use('/auth', require('./auth'))
  app.use('/api', require('./api'))

  // static file-serving middleware
  app.use(express.static(path.join(__dirname, '..', 'public')))

  // any remaining requests with an extension (.js, .css, etc.) send 404
  app.use((req, res, next) => {
    if (path.extname(req.path).length) {
      const err = new Error('Not found')
      err.status = 404
      next(err)
    } else {
      next()
    }
  })


  // sends index.html
  app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public/index.html'))
  })

  // error handling endware
  app.use((err, req, res, next) => {
    console.error(err)
    console.error(err.stack)
    res.status(err.status || 500).send(err.message || 'Internal server error.')
  })


}

const startListening = () => {
  // start listening (and create a 'server' object representing our server)
  const server = app.listen(PORT, () => console.log(`Mixing it up on port ${PORT}`))
  console.log('server is', server)
  /*
  //The app.listen() method returns an http.Server object and (for HTTP)
  ////is a convenience method for the following:
  app.listen = function() {
  var server = http.createServer(this)
  return server.listen.apply(server, arguments)
  }
  */

  const wsServer = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: true // You should use false here!
  });


  const connectionArray = []
  let nextID = Date.now()
  let appendToMakeUnique = 1

  websocketSetup(wsServer, connectionArray, nextID, appendToMakeUnique)
  /*from original code
  //set up our socket control center
  const io = socketio(server)
  */
}

const syncDb = () => db.sync()

// This evaluates as true when this file is run directly from the command line,
// i.e. when we say 'node server/index.js' (or 'nodemon server/index.js', or 'nodemon server', etc)
// It will evaluate false when this module is required by another module - for example,
// if we wanted to require our app in a test spec
if (require.main === module) {
  sessionStore.sync()
    .then(syncDb)
    .then(createApp)
    .then(startListening)
} else {
  createApp()
}


/*
  app.ws('/', (s, req) => {
    console.error('websocket connection')
    for (var t = 0; t < 3; t++)
      setTimeout(() => s.send('message from server', ()=>{}), 1000*t)
  })

  app.ws('/echo', function(ws, req) {
    ws.on('message', function(msg) {
      console.log(msg)
      ws.send(msg)
    })
    console.log('socket', req.testing)
*/
