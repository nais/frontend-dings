const cspString = `default-src 'self'; script-src; script-src-elem; script-src-attr; style-src 'unsafe-hashes' 'sha256-4Su6mBWzEIFnH4pAGMOuaeBrstwJN4Z3pq/s1Kn4/KQ='; style-src-elem; style-src-attr 'unsafe-hashes' 'sha256-4Su6mBWzEIFnH4pAGMOuaeBrstwJN4Z3pq/s1Kn4/KQ='; img-src; font-src; connect-src; media-src; object-src; prefetch-src 'self'; child-src; worker-src; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content; base-uri; manifest-src; plugin-types`;

const setup = (app) => {
    app.disable('X-Powered-By');
    app.use((req, res, next) => {
        res.header('X-Frame-Options', 'DENY');
        res.header('X-Xss-Protection', '1; mode=block');
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('Referrer-Policy', 'no-referrer');

        res.header('Content-Security-Policy', cspString);
        res.header('X-WebKit-CSP', cspString);
        res.header('X-Content-Security-Policy', cspString);

        res.header('Feature-Policy', "geolocation 'none'; microphone 'none'; camera 'none'");
        if (process.env.NODE_ENV === 'development') {
            res.header('Access-Control-Allow-Origin', 'http://localhost:1234');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST');
        }
        next();
    });
};

module.exports = { 
    setup 
};