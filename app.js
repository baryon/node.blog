/**
 * Module dependencies.
 */

var express = require('express'), ejs = require('ejs'), routes = require('./routes'), util = require('util');
var everyauth = require('everyauth'), opts = require('opts');
var marked = require('marked');

var Localize = require('localize');
var Mongolian = require("mongolian")
// Create a server instance with default host and port
var mongoserver = new Mongolian;

// Get database
var db = mongoserver.db("nodeblog")
var users = db.collection("users")

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

var whitelist = [ 'baryon' ];

everyauth.everymodule.findUserById(function(id, callback) {
	//我不知道这个函数什么时候被调用，怎么调用
	console.log('findUserById', id);
	users.findOne( {
		_id : new Mongolian.ObjectId(id)
	}, function(err, user) {
		console.log(err, user);
		if (err) {
			throw err;
		}
		callback(null, user);
	});
});

everyauth.github.entryPath('/auth/login').logoutPath('/auth/logout').appId(
		conf.github.appId).appSecret(conf.github.appSecret).findOrCreateUser(
		function(sess, accessToken, accessTokenExtra, ghUser) {
			console.log(sess, accessToken, accessTokenExtra, ghUser);
			//异步填充用户数据
			var promise = this.Promise();

			users.findOne( {
				gh_id : ghUser.id
			}, function(err, user) {
				if (err) {
					//如果没找到将插入一条记录到数据库中
					users.insert( {
						gh_id : ghUser.id,
						login : ghUser.login,
						gravatar_id : ghUser.gravatar_id,
						updated : new Date,
						published : new Date
					}, function(err, user) {
						//如果出错，返回出错契约,这将导致一个异常发生,我们需要在moduleErrback里面捕捉并处理它
						if (err)
							return promise.fail(err);
						
						//如果插入数据成功,填充契约
						promise.fulfill(user);
						console.log('inserted',promise);
						return promise;
					});
				} else {
					
					promise.fulfill(user);
					console.log('found',promise);
					return promise;
				}

			});
			//直接返回空的契约,等待异步填充
			console.log('ret',promise);
			return promise;
		}).moduleErrback(function(err) {
			//这里是各大问题，因为我们虽然捕捉到了异常,但是无法调用response，给用户一个友好的提示。这里应该可以把异常交给connect的下一个处理者.
	console.error(err);
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
		var lang = request.session.lang || "en";
		// || (request.headers['accept-language'] &&
			// request.headers['accept-language'].split('-')[0]
			// .toLowerCase()) || "en";
			localize.setLocale(lang);
			next();
		});
	app.use(everyauth.middleware()); //认证中间件
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
		//本来req.user里面应该由everyauth直接填充好，可是看上不是这样，我们自己来做
		req.user = req.session.auth.github.user;
		//本来这个user应该是一段我们从数据库里取出来的数据,可是现在居然是从github网站拿到原始数据
		console.log("buggze req.user", req.user);
		next();
	} else {
		res.redirect('/auth/login');
		// next(new Error('Unauthorized'));
	}
}
function administrator(req, res, next) {
	//本来应该在认证过程中判断whitelist，可是应为没有办法处理契约异常,只好拖到这里处理
	//但是这个处理是同步的，如果whitelist是通过数据库检测,我还真没有办法了
	//所以当务之急是完善everyauth
	if(req.loggedIn && whitelist.indexOf(req.user.login)>=0 ){
		next();
	}else{
		//如果不是管理员，那么我们就返回一个401错误页面,这是很友善的
		req.logout();
	    //next(new Error('Unauthorized'));
		res.render('unauthorized', 401);
	}
}

app.helpers( {
	site : {
		blog_title : 'node blog'
	},
	head : '',
	bottom : 'partials/empty.ejs',
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
	//让everyauth记得当前的网址,认证结束以后跳回来，这在tornado里面是由next参数实现的，可是现在我们真的很无奈
	everyauth.github.redirectPath(req.url);
	// res.local('bottom', 'partials/empty.ejs');
		next();
	});

app.get("/", routes.home);
app.get("/archive", routes.archive);
app.get("/feed", routes.feed);
app.get("/entry/:slug", routes.entry);
//这里通过express提供的路由中间件机制检查认证,如果不是管理员我们不放行
app.get("/compose", authenticated, administrator, routes.composeIndex);
app.post("/compose", authenticated, administrator, routes.compose);

//TODO:我们允许任何github用户提交评论,所以我们不检查是否当前用户是不是管理员
//app.get("/comment", authenticated, routes.commentIndex);
//app.post("/coment", authenticated, routes.comment);


app.register('.md', {
	compile : function(str, options) {
		var html = marked(str);
		return function(locals) {
			return html;
		};
	}
});
app.get('/doc/:title.md', function(req, res, next) {
	var path = [ '../doc/', req.params.title, '.md' ].join('');

	console.log(path);
	res.render(path, {
		layout : 'layout_doc.ejs'
	});
});

everyauth.helpExpress(app);

app.listen(port);
console.log("Express server listening on port %d in %s mode",
		app.address().port, app.settings.env);
