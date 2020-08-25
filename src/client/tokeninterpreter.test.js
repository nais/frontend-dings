import extractSubject from './tokeninterpreter'

test('single cookie present', () => {
    const subject = extractSubject(singleCookie)
    expect(subject).toEqual('1234567890')
})

test('multiple cookies present', () => {
    const subject = extractSubject(multipleCookies)
    expect(subject).toEqual('1234567890')
})

const singleCookie = 'dings-id=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
const multipleCookies = 'dings-id=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c; tullecookie=whatever'

