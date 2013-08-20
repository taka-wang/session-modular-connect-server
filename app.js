var routeGet = require("./route/http_get.js"),
    routePost= require("./route/http_post.js"),
    authInfo = require("./conf/auth.json"),
    svrInfo  = require("./conf/server.json"),
    sessions = require("client-sessions"),
    connect  = require("connect"),
    h_utils  = require("./route/http_utils.js"),
    server,
    logFile;

if (svrInfo.devmode) {
    server  = connect.createServer().use(connect.logger('dev'));
} else {
    logFile = require("fs").createWriteStream(
        svrInfo.logfile || require("moment")().format("MM-DD-HH-mm-ss") + ".txt", 
        {flag: "w"}
    );
    server  = connect.createServer().use(connect.logger({stream: logFile, format: "tiny"})); 
}

server
    .use(connect.query())                   // query string handle
    .use(connect.bodyParser())              // post data handle
    .use(sessions({                         // session
        secret: authInfo.key,               // should be a large unguessable string
        duration: authInfo.duration * 1000, // how long the session will stay valid in ms
    }))
    .use(connect.router(function(app){      // route http get
        for (var key in routeGet.route) {
            app.get(key, routeGet.route[key]);
        }
    }))
    .use(connect.router(function(app){      // route http post
        for (var key in routePost.route) {
            app.post(key, routePost.route[key]);
        }
    }))
    .use(function(req, res, next) {         // auth check
        if (typeof req.session_state.username === "undefined") {
            if (req.url === "/login.html") {// serve login page if not authed
                return next();              
            } else {                        // redirect all to login.html page
                h_utils.redirect(req, res, "/login.html");
            }
        } else {
            switch(req.url) {
            case "/login":                  // authed entry
                if (req.session_state.username === "admin") { //redirect for admin
                    h_utils.redirect(req, res, "/index.html");
                } else {                    // redirect for user, guest
                    h_utils.writeHtml(res, "Welcome " + req.session_state.username + "! (<a href='/logout'>logout</a>)");
                }
                break;
            case "/login.html":             // redirect to authed entry
                h_utils.redirect(req, res, "/login");
                break;
            default:                        //serve static files
                next();
            }  
        }
    })
    .use(function(err, req, res, next) {    //error handling
        res.end("Internal Server Error");
    })
    .use(connect.favicon(__dirname + "/public/favicon.ico"))   //serve static files
    .use(connect.static(__dirname + "/public/"))               //static files
    .listen(svrInfo.port, svrInfo.ip);

console.log("Server Listen: " + svrInfo.ip + ":" + svrInfo.port);