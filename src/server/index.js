import express from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import  { generators, TokenSet }  from 'openid-client'
import logger from 'winston-logstash-format'
import * as auth from './auth.js'
import * as config from './config.js'
import * as headers from './headers.js'
import * as apidings from './apidings.js'
import { limit } from'./ratelimit.js'

const app = express()

let authEndpoint = null
auth.setup(config.idporten, config.tokenx, config.app).then((endpoint) => {
    authEndpoint = endpoint
}).catch((err) => {
    logger.error(`Error while setting up auth: ${err}`)
    process.exit(1)
})

app.use(bodyParser.text())
headers.setup(app)
apidings.init(config.app.apidingsUrl)

app.use(limit);

app.set('trust proxy', 1);
app.use(session({
    // in a production app use a proper session store like Redis or similar
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: config.app.useSecureCookies, httpOnly: true, maxAge: 86400, sameSite: "lax" }
  }))

app.get(['/internal/isalive', '/internal/isready'], async (req, res) => { 
  res.sendStatus(200) 
});

app.get("/login", async (req, res) => { // lgtm [js/missing-rate-limiting]
  const session = req.session
  session.nonce = generators.nonce()
  session.state = generators.state()
  res.redirect(auth.authUrl(session))
})

app.get("/oauth2/callback", async (req, res) => {
  const session = req.session
  auth.validateOidcCallback(req)
      .then((tokens) => {
        session.tokens = tokens
          res.cookie('dings-id', `${tokens.id_token}`, {
              secure: config.app.useSecureCookies,
              sameSite: "lax",
              maxAge: 86400
          })
          res.redirect(303, '/')
      })
      .catch((err) => {
          logger.error(err)
          session.destroy(() => {})
          res.sendStatus(403)
      })
})

// check auth
app.use(async (req, res, next) => {
  let currentTokens = req.session.tokens
  if (!currentTokens) {
    res.redirect('/login')
  } else {
    let tokenSet = new TokenSet(currentTokens)
    if (tokenSet.expired()) {
      logger.debug('refreshing token')
      tokenSet = new TokenSet(await auth.refresh(currentTokens))
      req.session.tokens = tokenSet
    }
    return next()
  }
})

// authenticated routes below
app.get('/api/getstuff', async (req, res) => {
  try {
    const accessToken = await auth.exchangeToken(req.session.tokens.id_token)
    const response = await apidings.getStuff(accessToken);
    res.send(response)
  } catch (err) {
    logger.error(`Error while calling api: ${err}`)   
    res.sendStatus(500)
  }
})

app.use(express.static('dist/client'))

app.listen(config.app.port, () => {
  logger.info(`frontend-dings listening at port ${config.app.port}`)
})
