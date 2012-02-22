/**
 * node.js blog example
 */
var express = require('express'),
    ejs = require('ejs'),
    routes = require('./routes'),
    util = require('util');
var opts = require('opts');
var marked = require('marked');

var passport = require('passport'),
    GitHubStrategy = require('passport-github').Strategy;

var i18n = require("i18n");
var dateFormat = require('dateformat');

var Mongolian = require("mongolian");
// Create a server instance with default host and port
var mongoserver = new Mongolian;

// Get database
var db = mongoserver.db("nodeblog");
var users = db.collection("users");

var app = module.exports = express.createServer();

// Configuration
i18n.configure({
    // setup some locales - other locales default to en silently
    locales: ['en', 'ja', 'zh'],

    // where to register __() and __n() to, might be "global" if you
    // know what you are doing
    register: global
});

opts.parse([{
    'short': 'p',
    'long': 'port',
    'description': 'HTTP port',
    'value': true,
    'required': false
}, ]);

var port = opts.get('port') || 3000;

var conf = {
    github: {
        appId: '639014ffbf7a9435fc7f',
        appSecret: 'e0d2eacc5d1740041ab83a6945d066e5e2759cde'
    }
};

var administors = ['baryon'];

GitHubStrategy.prototype.userProfile = function (accessToken, done) {
    this._oauth2.getProtectedResource('https://api.github.com/user', accessToken, function (err, body, res) {
        if (err) {
            return done(err);
        }

        try {
            o = JSON.parse(body);

            done(null, o);
        } catch (e) {
            done(e);
        }
    });
};

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: conf.github.appId,
    clientSecret: conf.github.appSecret,
    callbackURL: "http://localhost:3000/auth/github/callback"
}, function (accessToken, refreshToken, profile, done) {
    users.findOne({
        gh_id: profile.id
    }, function (err, user) {
        if (!user) {
            // 如果没找到将插入一条记录到数据库中
            users.insert({
                gh_id: profile.id,
                username: profile.login,
                displayName: profile.name,
                email: profile.email,
                homepage: profile.blog,
                location: profile.location,
                gravatar_id: profile.gravatar_id,
                avatar_url: profile.avatar_url,
                updated: new Date,
                created: new Date
            }, function (err, user) {
                return done(err, user);
            });
        } else {
            return done(err, user);
        }

    });
}));

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'node.blog.secret.key'
    }));
    app.use(express.csrf());
    
    app.use(function (req, res, next) {
        var lang = req.session.lang;
        if(lang){
        	i18n.setLocale(req, lang);
        	next();
        }else
        	i18n.init(req, res, next);
    });
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
// app.use(express.errorHandler({
// dumpExceptions: true,
// showStack: true
// }));
});

app.configure('production', function () {
// app.use(express.errorHandler());
});

// Routes
// GET /auth/github
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in GitHub authentication will involve redirecting
// the user to github.com. After authorization, GitHubwill redirect the user
// back to this application at /auth/github/callback
app.get('/auth/github', passport.authenticate('github'), function (req, res) {
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
});

// GET /auth/github/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/'
}), function (req, res) {
    res.redirect(req.session.redirectPath || '/');
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/github');
}

function isAdministrator(req, res, next) {
    if (req.isAuthenticated() && administors.indexOf(req.user.username) >= 0) {
        next();
    } else {
        // 如果不是管理员，那么我们就返回一个403错误页面,这是很友善的
        // next(new Error('Unauthorized'));
        next(403);
    }
}

app.helpers({
    site: {
        blog_title: 'node blog'
    },
    head: '',
    bottom: 'partials/empty.ejs',
    dateFormat: dateFormat
});

app.dynamicHelpers({
    uri: function (req, res) {
        return req.url;
    },
    host: function (req, res) {
        return req.headers.host;
    },
    csrf_form_html: function (req, res) {
        return '<input type="hidden" name="_csrf" value="' + req.session._csrf + '" >';
    },
    user: function (req, res) {
        return req.user;
    }
});

ejs.filters.trim = function (obj) {
    if (obj) return String(obj).replace(/^\s+|\s+$/g, "");
    else return '';
};

app.error(function(err, req, res, next){
	if( err == 403 ) {
        res.render('403');
    } else if( err == 404 ) {
        res.render('404');
    } else if( err == 500 ) {
        res.render('500');
    } else {
    	res.render('error', {errorCode : err});
        // next(err);
    }
});
app.get(/^\/$|^\/(compose$|archive$|entry\/.+)/ig, function(req, res, next) {
	// 让everyauth记得当前的网址,认证结束以后跳回来，这在tornado里面是由next参数实现的，可是现在我们真的很无奈
	req.session.redirectPath = req.url;
	// res.local('bottom', 'partials/empty.ejs');
		next();
	});

app.get("/", routes.home);
app.get("/archive", routes.archive);
app.get("/feed", routes.feed);
app.get("/entry/:slug", routes.entry);
// 这里通过express提供的路由中间件机制检查认证,如果不是管理员我们不放行
app.get("/compose", ensureAuthenticated, isAdministrator, routes.composeIndex);
app.post("/compose", ensureAuthenticated, isAdministrator, routes.compose);

// TODO:我们允许任何github用户提交评论,所以我们不检查是否当前用户是不是管理员
// app.get("/comment", ensureAuthenticated, routes.commentIndex);
// app.post("/coment", ensureAuthenticated, routes.comment);
app.register('.md', {
    compile: function (str, options) {
        var html = marked(str);
        return function (locals) {
            return html;
        };
    }
});
app.get('/doc/:title.md', function (req, res, next) {
    var path = ['../doc/', req.params.title, '.md'].join('');
    res.render(path, {
        layout: 'layout_doc.ejs'
    });
});

app.listen(port);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);