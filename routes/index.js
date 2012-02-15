/*
 * node.blog 
 */
var Mongolian = require("mongolian")
var marked = require('marked');
require('fibers');

// Create a server instance with default host and port
var mongoserver = new Mongolian;

// Get database
var db = mongoserver.db("nodeblog")
var entries = db.collection("entries")

exports.home = function(req, res) {
	entries.find().limit(5).sort( {
		published : 1
	}).toArray(function(err, entries) {
		if (!err && entries) {
			res.render('home', {
				entries : entries
			});
		} else {
			res.render('home', {
				entries : []
			});
		}
	});
};

exports.entry = function(req, res) {
	var slug = req.params.slug;
	entries.findOne( {
		slug : slug
	}, function(err, entry) {
		if (!err && entry) {
			res.render('entry', {
				entry : entry
			});
		} else {
			res.send(500);
		}
	});
};

// exports.archive = function(req, res) {
// entries.find().sort( {
// published : 1
// }).toArray(function(err, entries) {
// if (!err && entries) {
// res.partial('archive/head.ejs', function(err, head) {
// res.render('archive', {
// entries : entries,
// head : head
// });
// });
// } else {
// res.send(500);
// }
// });
// };

exports.archive = function(req, res, next) {
	entries.find().sort( {
		published : 1
	}).toArray(function(err, entries) {
		if (err)
			return next(err);

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

exports.feed = function(req, res) {
	entries.find().limit(10).sort( {
		published : 1
	}).toArray(function(err, entries) {
		if (!err && entries) {
			res.render('feed', {
				layout : false,
				entries : entries
			});
		} else {
			res.send(500);
		}
	});
};

exports.composeIndex = function(req, res) {
	var id = req.param('id');
	if (id) {
		entries.findOne( {
			_id : new Mongolian.ObjectId(id)
		}, function(err, entry) {
			if (err)
				return next(err, 500);
			res.render('compose', {
				entry : entry,
				bottom : 'compose/bottom.ejs'
			});
			// if (!err && entry) {
				// res.partial('compose/bottom.ejs', function(err, bottom) {
				// res.render('compose', {
				// entry : entry,
				// bottom : bottom
				// });
				// });
				// } else {
				// res.send(500);
				// }
			});
	} else {
		// res.partial('compose/bottom.ejs', function(err, bottom) {
		// res.render('compose', {
		// entry : null,
		// bottom : bottom
		// });
		res.render('compose', {
			entry : null,
			bottom : 'compose/bottom.ejs'
		});
	}
};

exports.compose = function(req, res) {
	var id = req.param('id');
	var title = req.param('title');
	var text = req.param('markdown');
	var html = marked(text);

	if (id) {
		entries.findOne( {
			_id : new Mongolian.ObjectId(id)
		}, function(err, entry) {
			if (!err && entry) {
				entry.title = title;
				entry.markdown = text;
				entry.html = html;
				entry.updated = new Date;
				entries.save(entry);
				res.redirect("/entry/" + entry.slug);
			} else {
				res.send(500);
			}
		});
	} else {
		var slug = title.replace(/^\s+|\s+$/g, '').toLowerCase().split(
				/\s+|\W+/g).join('-');
		if (slug.length === 0)
			slug = 'entry';

		function checkSlug(slug) {
			var e = entries.find( {
				slug : slug
			}).count(function(err, entry) {
				if (!err && entry) {
					checkSlug(slug + "-2");
				} else {
					entries.insert( {
						title : title,
						slug : slug,
						markdown : text,
						html : html,
						updated : new Date,
						published : new Date
					}, function(err, entry) {
						if (!err && entry) {
							res.redirect("/entry/" + slug);
						} else {
							res.send(500);
						}
					});
				}
			});
		}
		checkSlug(slug);
	}

};
