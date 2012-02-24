#异步#	

###1.目的###	
aaaa
aaaa
 
###2.方案选择###	 
啊啊啊啊
node的wiki上的总结
[Control flow / Async goodies](https://github.com/joyent/node/wiki/modules#wiki-async-flow)  

[fibers(1) ](https://github.com/laverdet/node-fibers)  
[Step](https://github.com/creationix/step)
[async](https://github.com/caolan/async)  


###3.操作步骤###	   

正常的代码  

	exports.archive = function(req, res, next) {
		entries.find().sort( {
			published : 1
		}).toArray(function(err, entries) {
			if (!err && entries) {
				res.partial('archive/head.ejs', function(err, head) {
					res.render('archive', {
						entries : entries,
						head : head
					});
				});
			} else {
				next(500);
			}
		});
	};

使用fibers的代码写法  

	require('fibers');
	exports.archive = function(req, res, next) {
		entries.find().sort( {
			published : -1
		}).toArray(function(err, entries) {
			if (err) {
				next(500);
			}
			var head = Fiber(function(view, options) {
				res.partial(view, options, function(err, head) {
					if (err)
						return next(err);
					yield(head);
				});
			}).run('archive/head.ejs');
	
			res.render('archive', {
				entries : entries,
				head : head
			});
	
		});
	};


使用Step的写法  

	var Step = require('step');
	exports.archive = function(req, res, next) {
		Step(
		function partial() {
			entries.find().sort( {
				published : -1
			}).toArray(this.parallel());
	
			res.partial('archive/head.ejs', this.parallel());
		},
	
		function(err, entries, head) {
			if (err)
				return next(err);
			res.render('archive', {
				entries : entries,
				head : head
			});
		}
		);
	};


使用async的写法  

	var async = require('async');
	exports.archive = function(req, res, next) {
		async.parallel({
			posts: function(callback){
				entries.find().sort( {
					published : -1
				}).toArray(callback);
			},
			head: function(callback){
				res.partial('archive/head.ejs', callback);
			}
		},
	
		function(err, results) {
			if (err)
				return next(err);
			res.render('archive', {
				entries : results.posts,
				head : results.head
			});
		}
		);
	};


###4.思考和讨论###	 
啊啊啊

简介  
[JavaScript异步编程的Promise模式](http://www.infoq.com/cn/news/2011/09/js-promise)  
[NodeJS的异步编程风格](http://www.infoq.com/cn/news/2011/09/nodejs-async-code)

[专家观点——袁锋谈Node.js开发技巧](http://www.infoq.com/cn/news/2011/11/yuanfeng-nodejs)  
其实异步代码嵌套问题只是刚接触nodejs的同学害怕的问题，一旦你真的要去面对它和解决它的时候，会发现这些问题都是有适合你的办法，很好地处理的。

Step和async是比较容易上手的，async可以同时运用在前端和后端，而且功能函数众多，受到更多的关注

