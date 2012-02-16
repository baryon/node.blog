#用户认证#	

###1.目的###	
aaaa
aaaa
 
###2.方案选择###	 
[everyauth](https://github.com/bnoguchi/everyauth)
[passport](http://passportjs.org/)

###3.操作步骤###	   
啊啊啊

###4.思考和讨论###	 
[passport](http://passportjs.org/)
真是一个好库,完全解决了认证的问题
它基于策略,可以方便的支持各种登陆方案,即使是已经存在的策略也有方便的修改方案.
超酷
好后悔浪费在everyauth上的大量时间

everyauth的实现基于了函数的链表风格,一个一个函数链接下去，可惜在满是异步调用的node里不是好的方案.
everyauth在异步处理上使用Promise， 这不是一个好的方案,我们不知道这个Promie什么时候被填充,特别是在异常的情况下,我们没法返回一个友好的界面给用户.
而passport基于策略模式可以很好的解决这些问题。可能策略同异步没有太大关系，但他确实管用
 
[everyauth](https://github.com/bnoguchi/everyauth)是非常让人恼火的库,对于出错的处理没有好的机制,我虽然可以捕捉到异常但是无法抛给客户端定制化的页面
主要发生在异步填充用户数据上。 大段代码都是处理认证问题, 但是仍然不令人满意

	var everyauth = require('everyauth')
	
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
		... ...
		app.use(express.cookieParser());
		app.use(express.session( {
			secret : 'node.blog.secret.key'
		}));

		app.use(everyauth.middleware()); //认证中间件
		app.use(app.router);
		... ...
	});


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
	
	app.get(/^\/$|^\/(compose$|archive$|entry\/.+)/ig, function(req, res, next) {
		//让everyauth记得当前的网址,认证结束以后跳回来，这在tornado里面是由next参数实现的，可是现在我们真的很无奈
		everyauth.github.redirectPath(req.url);
		// res.local('bottom', 'partials/empty.ejs');
			next();
		});
	
	
	//这里通过express提供的路由中间件机制检查认证,如果不是管理员我们不放行
	app.get("/compose", authenticated, administrator, routes.composeIndex);
	app.post("/compose", authenticated, administrator, routes.compose);
	
	//TODO:我们允许任何github用户提交评论,所以我们不检查是否当前用户是不是管理员
	//app.get("/comment", authenticated, routes.commentIndex);
	//app.post("/coment", authenticated, routes.comment);
