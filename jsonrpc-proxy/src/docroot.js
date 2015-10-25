var TAG = "DocRoot:"

var Http = require('http');
var FS = require('fs');
var Mime = require('mime');
var Glob = require('glob');

var BASE_DIR = __dirname + "/../docroot/";

function requestListener(req, res) {
	console.log(TAG, req.url);
	var path = getLocalPath(req.parsedUrl.pathname);
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
		res.setHeader('Content-type', Mime.lookup(path) + ";charset=utf-8");
	} catch (err) {
		onError(err, req, res);
	}
}

function listingHtml(path, pathname) {
	var list = FS.readdirSync(path);
	var html = "<html><body><h2>" + pathname + "</h2><ul>";
	for (var i = 0; i < list.length; i++) {
		var name = list[i];
		var stat = fileStat(path + "/" + name);
		if (stat && stat.isDirectory()) {
			html += "\n<li><a href='" + name + "/'>" + name + "/</a>";
		} else if (name.match(/[.]js$/)) {
			html += "\n<li><a href='/edit.html?" + pathname + name + "'>" + name + "</a>";
		} else {
			html += "\n<li><a href='" + name + "'>" + name + "</a>";
		}
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

function getLocalPath(path) {
	return BASE_DIR + path;
}

function treeListener(req, res) {
	var path = req.params.path || "";

	var tree = getTree(getLocalPath(path), path);
	var buff = new Buffer(JSON.stringify(tree));
	res.setHeader('Content-type', 'application/json');
	res.setHeader("content-length", buff.length);
	res.write(buff);
	res.end();
}
function getTree(dir, path) {
	console.log(TAG, "getTree", dir);
	var result = [];
	var list = FS.readdirSync(dir);
	for (var i = 0; i < list.length; i++) {
		var name = list[i];
		var stat = fileStat(dir + "/" + name);
		if (stat && stat.isDirectory()) {
			result.push({
				name : name,
				absPath : path + "/" + name,
				children : getTree(dir + "/" + name, path + "/" + name)
			});
		} else {
			result.push({
				name : name,
				absPath : path + "/" + name
			});
		}
	}
	return result;
}

exports.requestListener = requestListener;
exports.treeListener = treeListener;
exports.getLocalPath = getLocalPath;
