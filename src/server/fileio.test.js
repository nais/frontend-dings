const fileio = require('./fileio')

test('read a file', () => {
    const fileContents = fileio.readFile('README.md')
    expect(fileContents).not.toBeNull()
})