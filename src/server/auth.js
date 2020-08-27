const { Issuer } = require('openid-client')
const logger = require('winston-logstash-format')
const jwt = require('jsonwebtoken')
const ULID = require('ulid')
const jose = require('node-jose')

let tokenxConfig = null
let tokenxClient = null
let tokenxMetadata = null;
let idportenConfig = null
let idportenClient = null
let appConfig = null

const setup = async (idpConfig, txConfig, appConf) => {
    idportenConfig = idpConfig
    tokenxConfig = txConfig
    appConfig = appConf
    return init().then((clients) => {
        idportenClient = clients.idporten
        tokenxClient = clients.tokenx
    })
}

const init = async () => {
    const idporten = await Issuer.discover(idportenConfig.discoveryUrl)
    const tokenx = await Issuer.discover(tokenxConfig.discoveryUrl)
    tokenxMetadata = tokenx
    logger.info(`discovered idporten @ ${idporten.issuer}`)
    logger.info(`discovered tokenx @ ${tokenx.issuer}`)
    try {
        idportenClient = new idporten.Client({
            client_id: idportenConfig.clientID,
            client_secret: idportenConfig.clientSecret,
            redirect_uris: [idportenConfig.redirectUri, 'http://localhost:3000/callback'],
            response_types: ['code']
        })
        
        tokenxClient = new tokenx.Client({
            client_id: tokenxConfig.clientID,
            redirect_uris: [tokenxConfig.redirectUri, 'http://localhost:3000/callback']
        })
        
        return Promise.resolve({idporten: idportenClient, tokenx: tokenxClient})
    } catch (err) {
        return Promise.reject(err)
    }
}

const authUrl = (session) => {
    return idportenClient.authorizationUrl({
        scope: idportenConfig.scope,
        redirect_uri: idportenConfig.redirectUri,
        response_type: idportenConfig.responseType[0],
        response_mode: 'query',
        nonce: session.nonce,
        state: session.state,
    })
}

const validateOidcCallback = async (req) => {
    const params = idportenClient.callbackParams(req)
    const nonce = req.session.nonce
    const state = req.session.state

    return idportenClient
        .callback(idportenConfig.redirectUri, params, { nonce, state })
        .catch((err) => Promise.reject(`error in oidc callback: ${err}`))
        .then(async (tokenSet) => {
            return tokenSet
        })
}

const exchangeToken = async (idportenToken) => 
    tokenxClient.grant({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: createClientAssertion(), 
        audience: tokenxMetadata.token_endpoint,
        subject_token: idportenToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt'
    }).then(tokenSet => {
        Promise.resolve(tokenSet.access_token)
    }).catch(err => {
        logger.error(`Error while exchanging token: ${err}`)
        Promise.reject(err)
    })

const refresh = (oldTokenSet) => 
    idportenClient.refresh(oldTokenSet).then((newTokenSet) => {
        Promise.resolve(newTokenSet)
    }).catch(err => {
        logger.error(err)
        Promise.reject(err)
    })

const createClientAssertion = async () => {
    const now = Date.now() / 1000
    const clusterPrefix = appConfig.isProd ? 'prod' : 'dev'
    return jwt.sign({ 
        'sub': `${clusterPrefix}-gcp:plattformsikkerhet:frontend-dings`,
        'aud': tokenxMetadata.token_endpoint,
        'iss': `${clusterPrefix}-gcp:plattformsikkerhet:frontend-dings`,
        'exp': now + 60, // max 120
        'iat': now,
        'jti': ULID.ulid()
    }, await privateKeyToPem(tokenxConfig.privateJwk), { algorithm: 'RS256' })
}

const privateKeyToPem = async (jwk) => jose.JWK.asKey(jwk)
    .then((key) => {
        return Promise.resolve(key.toPEM(true))
    })

module.exports = { 
    setup,
    authUrl,
    validateOidcCallback,
    exchangeToken,
    refresh
}

