require('dotenv').config()

const app = {
    sessionSecret: process.env.SESSION_SECRET || TemmeligHemmelig,
    isProd: process.env.NODE_ENV === "production",
    port: process.env.PORT || 3000
}

const idporten = {
    discoveryUrl: process.env.DISCOVERY_URL_IDPORTEN,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri : process.env.REDIRECT_URI || "http://localhost:3000/callback",
    responseType: ['code'],
    scope: 'openid',
}

const tokenx = {
    discoveryUrl: process.env.DISCOVERY_URL_TOKENX || 'https://tokendings.dev-gcp.nais.io/.well-known/oauth-authorization-server'
}

module.exports = {
    app,
    idporten,
    tokenx
}