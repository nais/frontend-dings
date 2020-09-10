const {Issuer} = require('openid-client')
const logger = require('winston-logstash-format')
const jwt = require('jsonwebtoken')
const ULID = require('ulid')
const jose = require('node-jose')

let tokenxConfig = null
let tokenxClient = null
let tokenxMetadata = null;
let idportenConfig = null
let idportenClient = null
let idportenMetadata = null;
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
    idportenMetadata = idporten
    logger.info(`discovered idporten @ ${idporten.issuer}`)
    logger.info(`discovered tokenx @ ${tokenx.issuer}`)
    try {
        jwk = JSON.parse(idportenConfig.clientJwk)
        jwks = {
            keys: [jwk]
        }
        idportenClient = new idporten.Client({
            client_id: idportenConfig.clientID,
            token_endpoint_auth_method: 'private_key_jwt',
            token_endpoint_auth_signing_alg: 'RS256',
            redirect_uris: [idportenConfig.redirectUri, 'http://localhost:3000/callback'],
            response_types: ['code']
        }, jwks)

        tokenxClient = new tokenx.Client({
            client_id: tokenxConfig.clientID,
            redirect_uris: [tokenxConfig.redirectUri, 'http://localhost:3000/callback'],
            token_endpoint_auth_method: 'none'
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
        .callback(idportenConfig.redirectUri, params, {nonce, state}, { clientAssertionPayload: { aud: idportenMetadata.metadata.issuer }})
        .catch((err) => Promise.reject(`error in oidc callback: ${err}`))
        .then(async (tokenSet) => {
            return tokenSet
        })
}

const exchangeToken = async (idportenToken) => {
    const clientAssertion = await createClientAssertion()
    return tokenxClient.grant({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        token_endpoint_auth_method: 'private_key_jwt',
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        client_assertion: clientAssertion,
        audience: appConfig.targetAudience,
        subject_token: idportenToken
    }).then(tokenSet => {
        return Promise.resolve(tokenSet.access_token)
    }).catch(err => {
        logger.error(`Error while exchanging token: ${err}`)
        return Promise.reject(err)
    })
}

const refresh = (oldTokenSet) =>
    idportenClient.refresh(oldTokenSet).then((newTokenSet) => {
        return Promise.resolve(newTokenSet)
    }).catch(err => {
        logger.error(err)
        return Promise.reject(err)
    })

const createClientAssertion = async () => {
    const now = Math.floor(Date.now() / 1000)
    return jwt.sign({
        'sub': `${appConfig.cluster}:plattformsikkerhet:frontend-dings`,
        'aud': tokenxMetadata.token_endpoint,
        'iss': `${appConfig.cluster}:plattformsikkerhet:frontend-dings`,
        'exp': now + 60, // max 120
        'iat': now,
        'jti': ULID.ulid(),
        'nbf': now,
    }, await privateKeyToPem(tokenxConfig.privateJwk), {algorithm: 'RS256'})
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

