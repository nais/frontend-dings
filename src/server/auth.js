const { Issuer } = require('openid-client')
const logger = require('winston-logstash-format')

let tokenxConfig = null
let tokenxClient = null
let idportenConfig = null
let idportenClient = null

const setup = async (idpConfig, txConfig) => {
    idportenConfig = idpConfig
    tokenxConfig = txConfig
    return init().then((clients) => {
        idportenClient = clients.idporten
        tokenxClient = clients.tokenx
    })
}

const init = async () => {
    const idporten = await Issuer.discover(idportenConfig.discoveryUrl)
    const tokenx = await Issuer.discover(tokenxConfig.discoveryUrl)
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
            client_id: idportenConfig.clientID,
            client_secret: idportenConfig.clientSecret,
            redirect_uris: [idportenConfig.redirectUri, 'http://localhost:3000/callback'],
            response_types: ['code']
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

const exchangeToken = async (idportenToken, clientAssertion, audience) => 
    tokenxClient.grant({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        audience: audience,
        subject_token: idportenToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt"
    }).then(tokenSet => {
        Promise.resolve(tokenSet.access_token)
    }).catch(err => {
        logger.error(err)
        Promise.reject(err)
    })

module.exports = { 
    setup,
    authUrl,
    validateOidcCallback,
    exchangeToken
}
