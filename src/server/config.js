require('dotenv').config()

const app = {
    sessionSecret: process.env.SESSION_SECRET || "TemmeligHemmelig",
    useSecureCookies: process.env.NAIS_CLUSTER_NAME ? true : false, 
    port: process.env.PORT || 3000,
    apidingsUrl: process.env.NAIS_CLUSTER_NAME === "dev-gcp" ? 'https://api-dings.dev-fss-pub.nais.io' : 'https://api-dings.prod-fss-pub.nais.io',
    targetAudience: process.env.API_DINGS_AUDIENCE || 'dev-fss:plattformsikkerhet:api-dings',
    cluster: process.env.NAIS_CLUSTER_NAME || ''
}

const idporten = {
    discoveryUrl: process.env.DISCOVERY_URL_IDPORTEN || "https://oidc-ver2.difi.no/idporten-oidc-provider/.well-known/openid-configuration",
    clientID: process.env.IDPORTEN_CLIENT_ID || "bogus_client",
    clientSecret: process.env.IDPORTEN_CLIENT_SECRET || "bogus_secret",
    redirectUri : process.env.REDIRECT_URI || "http://localhost:3000/callback",
    responseType: ['code'],
    scope: 'openid',
}

const tokenx = {
    discoveryUrl: process.env.TOKEN_X_WELL_KNOWN_URL || 'https://tokendings.dev-gcp.nais.io/.well-known/oauth-authorization-server',
    clientID: process.env.TOKEN_X_CLIENT_ID || "bogus_client",
    privateJwk: JSON.parse(process.env.TOKEN_X_PRIVATE_JWK || "bogus_jwk")
}

module.exports = {
    app,
    idporten,
    tokenx
}