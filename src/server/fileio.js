var fs = require('fs')

const readFile = (path) => fs.readFileSync(path, 'utf8')

module.exports = {
    readFile
}