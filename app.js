/**
 * Module dependencies.
 */

var express = require('express'), ejs = require('ejs'), routes = require('./routes'), util = require('util');
var everyauth = require('everyauth'), opts = require('opts')
var Localize = require('localize');
var Mongolian = require("mongolian")
// Create a server instance with default host and port
var mongoserver = new Mongolian;

// Get database
var db = mongoserver.db("nodeblog")
var users = db.collection("users")
//TODO: save user info to database


var app = module.exports = express.createServer();

// Configuration
var localize = new Localize('./translations/');
localize.loadDateFormats( {
	"en" : {
		dayNames : [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sunday",
				"Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
				"Saturday" ],
		monthNames : [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
				"Sep", "Oct", "Nov", "Dec", "January", "February", "March",
				"April", "May", "June", "July", "August", "September",
				"October", "November", "December" ],
		masks : {
			"default" : "ddd mmm dd yyyy HH:MM:ss",
			shortDate : "m/d/yy",
			mediumDate : "mmm d, yyyy",
			longDate : "mmmm d, yyyy",
			fullDate : "dddd, mmmm d, yyyy",
			shortTime : "h:MM TT",
			mediumTime : "h:MM:ss TT",
			longTime : "h:MM:ss TT Z",
			isoDate : "yyyy-mm-dd",
			isoTime : "HH:MM:ss",
			isoDateTime : "yyyy-mm-dd'T'HH:MM:ss",
			isoUtcDateTime : "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
		}
	}
});

opts.parse( [ {
	'short' : 'p',
	'long' : 'port',
	'description' : 'HTTP port',
	'value' : true,
	'required' : false
}, ]);

var port = opts.get('port') || 3000;

var conf = {
	github : {
		appId : '639014ffbf7a9435fc7f',
		appSecret : 'e0d2eacc5d1740041ab83a6945d066e5e2759cde'
	}
};


everyauth.debug = true;

var usersById = {};
var nextUserId = 0;

function addUser(source, sourceUser) {
	var user;
	user = usersById[++nextUserId] = {
		id : nextUserId
	};
	user[source] = sourceUser;
	return user;
}

var usersByGhId = {};

everyauth.everymodule.findUserById(function(id, callback) {
	callback(null, usersById[id]);
});

everyauth.github.entryPath('/auth/login').logoutPath('/auth/logout').appId(
		conf.github.appId).appSecret(conf.github.appSecret).findOrCreateUser(
		function(sess, accessToken, accessTokenExtra, ghUser) {
			return usersByGhId[ghUser.id]
					|| (usersByGhId[ghUser.id] = addUser('github', ghUser));
		}).redirectPath('/');

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session( {
		secret : 'node.blog.secret.key'
	}));
	app.use(express.csrf());
	app.use(function(request, response, next) {
		var lang = request.session.lang
				|| request.headers['accept-language'].split('-')[0]
						.toLowerCase() || "en";
		localize.setLocale(lang);
		next();
	});
	app.use(everyauth.middleware());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.use(express.errorHandler( {
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('production', function() {
	app.use(express.errorHandler());
});

// Routes
function authenticated(req, res, next) {
	if (req.loggedIn) {
		//console.log("req.user", req.user);
		next();
	} else {
		res.redirect('/auth/login');
		// next(new Error('Unauthorized'));
	}
}

app.helpers( {
	site : {
		blog_title : 'node blog'
	},
	head : '',
	bottom : '',
	_ : localize.translate,
	localDate : localize.localDate,
	strings : localize.strings
});

app.dynamicHelpers( {
	uri : function(req, res) {
		return req.url;
	},
	host : function(req, res) {
		return req.headers.host;
	},
	token : function(req, res) {
		return req.session._csrf;
	}
});

ejs.filters.trim = function(obj) {
	if (obj)
		return String(obj).replace(/^\s+|\s+$/g, "");
	else
		return '';
};

app.get(/^\/$|^\/(compose$|archive$|entry\/.+)/ig, function(req, res, next) {
	everyauth.github.redirectPath(req.url);
	next();
});

app.get("/", routes.home);
app.get("/archive", routes.archive);
app.get("/feed", routes.feed);
app.get("/entry/:slug", routes.entry);
app.get("/compose", authenticated, routes.composeIndex);
app.post("/compose", authenticated, routes.compose);

everyauth.helpExpress(app);

app.listen(port);
console.log("Express server listening on port %d in %s mode",
		app.address().port, app.settings.env);
