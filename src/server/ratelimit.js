const rateLimit = require('express-rate-limit')

const limit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'You have exceeded the 100 requests in 1 minute limit!', 
    headers: true,
  })

module.exports = {
    limit
}