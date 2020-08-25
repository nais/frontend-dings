const extractSubject = (cookies) => {
    const idToken = idTokenFromCookies(cookies).toString()
    const encodedClaims = idToken.split('.')[1]
    const decodedClaims = atob(encodedClaims)
    return JSON.parse(decodedClaims)['sub']
}

const idTokenFromCookies = (cookies) => 
    cookies.split(';')
           .filter((part) => part.startsWith('dings-id'))
           .map((cookie) => cookie.substring(cookie.indexOf('=') + 1))

export default extractSubject
