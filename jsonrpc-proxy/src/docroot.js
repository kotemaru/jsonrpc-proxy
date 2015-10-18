var TAG = "DocRoot:"

var Http = require('http');
var FS = require('fs');
var Mime = require('mime');

function requestListener(req, res) {
	console.log(TAG, req.url);
	var path = __dirname + "/../docroot" + req.parsedUrl.pathname;
	try {
		var stat = fileStat(path);
		if (stat != null && stat.isDirectory()) {
			var stat = fileStat(path + "/index.html");
			if (stat == null) {
				res.setHeader('Content-type', 'text/html');
				res.write(listingHtml(path, req.parsedUrl.pathname));
				res.end();
				return;
			}
			path += "/index.html";
		}

		if (stat == null || !stat.isFile()) {
			console.warn(TAG, "Not found", path);
			res.statusCode = 404;
			res.setHeader('Content-type', 'text/plain');
			res.write("404 Not found.");
			res.end();
			return;
		}

		var src = FS.createReadStream(path);
		src.pipe(res);
		src.on('error', function(err) {
			onError(err, req, res);
		});
		res.setHeader('Content-type', Mime.lookup(path)+";charset=utf-8");
	} catch (err) {
		onError(err, req, res);
	}
}

function listingHtml(path, title) {
	var list = FS.readdirSync(path);
	var html = "<html><body><h2>" + title + "</h2><ul>";
	for (var i = 0; i < list.length; i++) {
		var name = list[i];
		var stat = fileStat(path + "/" + name);
		if (stat && stat.isDirectory()) {
			name = name + "/";
		}
		html += "\n<li><a href='" + name + "'>" + name + "</a>";
	}
	html += "\n</ul></body></html>";
	return html;
}

function onError(err, req, res) {
	console.error(TAG, err.toString());
	try {
		res.statusCode = 500;
		res.setHeader('Content-type', 'text/plain');
		res.write("500 Server error. \n" + err.toString());
		res.end();
	} catch (e) {
		console.error(TAG, "Ignore error on error", e.toString());
	}
}

function fileStat(path) {
	if (!FS.existsSync(path)) return null;
	return FS.statSync(path);
}

exports.requestListener = requestListener;
