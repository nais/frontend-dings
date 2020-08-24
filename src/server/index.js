const express = require("express")
const session = require('express-session')
const  bodyParser = require('body-parser')
const { generators, TokenSet } = require('openid-client')
const auth = require('./auth')
const config = require('./config')
const logger = require('winston-logstash-format')
const headers = require('./headers')

const app = express()

let authEndpoint = null
auth.setup(config.idporten, config.tokenx).then((endpoint) => {
    authEndpoint = endpoint
}).catch((err) => {
    logger.error(err)
    process.exit(1)
})

app.use(bodyParser.text())
headers.setup(app)

app.use(session({
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: config.isProd, httpOnly: true, maxAge: 3600000, sameSite: "lax" }
  }))

app.get(['/internal/isalive', '/internal/isready'], async (req, res) => { 
  res.sendStatus(200) 
});

app.get("/login", async (req, res) => {
  const session = req.session
  session.nonce = generators.nonce()
  session.state = generators.state()
  res.redirect(auth.authUrl(req.session))
})

app.get("/callback", async (req, res) => {
  const session = req.session
  auth.validateOidcCallback(req)
      .then((tokens) => {
        session.tokens = tokens
          res.cookie('dings-id', `${tokens.id_token}`, {
              secure: config.isProd,
              sameSite: "lax",
          })
          res.redirect(303, '/')
      })
      .catch((err) => {
          logger.error(err)
          session.destroy(() => {})
          res.sendStatus(403)
      })
})

// authenticated routes
app.get('/api/getstuff', (req, res) => res.send({
  stuff: 'thing',
  thing: 'stuff'
}))

app.use(async (req, res, next) => {
  const tokenSet = new TokenSet(req.session.tokens)
  const needsLogin = !tokenSet.id_token || tokenSet.expired()
  if (needsLogin) {
    res.redirect('/login')
  } else {
    return next()
  }
})

app.use(express.static('dist/client'))

app.listen(config.app.port, () => {
  logger.info(`frontend-dings listening at port ${config.app.port}`)
})
