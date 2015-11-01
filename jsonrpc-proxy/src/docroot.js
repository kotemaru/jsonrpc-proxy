/**
 * 静的コンテンツを応答する。
 * <li>通常のWebサーバの動作をするモジュール。
 * <li>ルートは "docroot"
 */

var TAG = "DocRoot:"

var Http = require('http');
var FS = require('fs');
var Mime = require('mime');
var Glob = require('glob');
var Done = require('./done');

var BASE_DIR = __dirname + "/../docroot/";

/**
 * HTTPリスナ：ローカルファイルをそのまま応答する。
 * <li>フォルダは"index.html"を応答する。
 * <li>index.html がなければファイル一覧を応答する。
 *
 * @param req
 * @param res
 * @returns
 */
function doGet(req, res) {
	console.log(TAG, req.url);
	var path = getLocalPath(req.parsedUrl.pathname);
	try {
		var stat = fileStat(path);
		if (stat != null && stat.isDirectory()) {
			var stat = fileStat(path + "/index.html");
			if (stat == null) {
				return Done.html(res, dirHtml(path, req.parsedUrl.pathname));
			}
			path += "/index.html";
		}

		if (stat == null || !stat.isFile()) {
			return Done.error(res, 404, "404 Not found.");
		}

		var src = FS.createReadStream(path);
		src.pipe(res);
		src.on('error', function(err) {
			onError(err, req, res);
		});
		res.setHeader('Content-type', Mime.lookup(path) + ";charset=utf-8");
	} catch (err) {
		return Done.error(res, 500, "500 Server error. \n" + err.toString());
	}
}

/**
 * フォルダ配下のファイル一覧をHTMLで返す。
 *
 * @param path 物理パス
 * @param pathname 論理パス
 * @returns {String} HTML
 */
function dirHtml(localPath, pathname) {
	var list = FS.readdirSync(localPath);
	var html = "<html><body><h2>" + pathname + "</h2><ul>";
	for (var i = 0; i < list.length; i++) {
		var name = list[i];
		var stat = fileStat(localPath + "/" + name);
		if (stat && stat.isDirectory()) {
			html += "\n<li><a href='" + name + "/'>" + name + "/</a>";
		} else if (name.match(/[.]js$/)) {
			html += "\n<li><a href='" + name + "'>" + name + "</a>";
		} else {
			html += "\n<li><a href='" + name + "'>" + name + "</a>";
		}
	}
	html += "\n</ul></body></html>";
	return html;
}

function fileStat(path) {
	if (!FS.existsSync(path)) return null;
	return FS.statSync(path);
}

/**
 * 論理パスを物理パスに変換する。
 *
 * @param path
 * @returns {String}
 */
function getLocalPath(path) {
	return BASE_DIR + path;
}

/**
 * HTTPリスナ：ローカルファイルのフォルダツリーをJSONで応答する。
 * <li>リクエストパスはフォルダの必要がある。
 * <li>応答フォーマットは
 *
 * <xmp> [ {name:"ファイル名", absPath:"フルパス", children[サブフォルダ...]},... ] </xmp>
 *
 * @param req
 * @param res
 */
function doGetTree(req, res) {
	var path = req.params.path || "";
	var tree = getTree(getLocalPath(path), path);
	Done.json(res, tree);
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

exports.doGet = doGet;
exports.doGetTree = doGetTree;
exports.getLocalPath = getLocalPath;
