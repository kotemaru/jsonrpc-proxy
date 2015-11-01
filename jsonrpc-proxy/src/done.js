/**
 * HTTPの応答をするユティリティ。
 */


var TAG = "Done:";
var CONTENT_LENGTH = "Content-length";
var CONTENT_TYPE = "Content-type";



/**
 * HTTP応答を返してHTTP要求を終了する。
 * @param res  {http.ServerResponse}  HTTP応答オブジェクト
 * @param ctype {string} Content-type
 * @param buff {Buffer}  応答本文（UTF-8のbyte列)
 */
function done(res, ctype, buff) {
	res.setHeader(CONTENT_TYPE, ctype);
	res.setHeader(CONTENT_LENGTH, buff.length);
	res.write(buff);
	res.end();
};


exports.done = done;

exports.text = function(res, text) {
	done(res, "text/plain;charset=utf-8", new Buffer(text));
};

exports.html = function(res, html) {
	done(res, "text/html", new Buffer(html));
};

exports.json = function(res, data) {
	var buff = new Buffer(JSON.stringify(data));
	done(res, "applecation/json;charset=utf-8", buff);
};

exports.error = function(res, code, data) {
	console.error(TAG, "error", code, data);
	try {
		res.statusCode = code;
		if (typeof data == "string") {
			exports.text(res, data);
		} else {
			exports.json(res, data);
		}
	} catch (e) {
		console.error(e);
	}
};


