const fetch = require('node-fetch')

let baseUrl = null

const init = (apidingsUrl) => {
    baseUrl = apidingsUrl
}

const getStuff = async (bearerToken) => {
    return fetch(`${baseUrl}/hello`, {
        method: 'get',
        headers: {"Authorization": `Bearer ${bearerToken}`}
    }).then(res => Promise.resolve(res.text()))
}

module.exports = {
    init,
    getStuff
}
