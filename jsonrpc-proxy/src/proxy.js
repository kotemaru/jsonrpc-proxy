/**
 * プロキシ制御メインモジュール
 */
var TAG = "Proxy:"

var Http = require('http');
var Url = require('url');
var Net = require('net');
var Minimatch = require("minimatch").Minimatch
var Done = require('./done');


/**
 * HTTPリスナ：HTTPリクエストを転送する。
 * @param req
 * @param res
 */
function transrate(req, res) {
	console.log(TAG, "transrate", req.url);

	var opts = createRequestOpts(req);
	var svrReq = Http.request(opts, function(svrRes) {
		res.writeHead(svrRes.statusCode, svrRes.headers);
		svrRes.pipe(res);
	});
	svrReq.on('error', function(err) {
		console.error(TAG, "transrate", err);
		Done.error(res, 502, "502 Bad gateway");
	});
	req.pipe(svrReq);
}

function createRequestOpts(req) {
	var opts = {
		method : req.method,
		host : req.parsedUrl.hostname || req.headers.host,
		port : req.parsedUrl.port || 80,
		path : req.parsedUrl.path,
		headers : req.headers
	};
	opts.host = opts.host.replace(/:[0-9]*$/, "");
	return opts;
}

/**
 * HTTPリスナ：CONNECT用。HTTPS用のトンネルを作成する。
 * @param req
 * @param cSock  クライアント側ソケット
 * @param reqHeaders
 */
function doConnect(req, cSock, reqHeaders) {
	console.log(TAG, "connect", req.url);

	var _url = Url.parse('https://' + req.url);
	var port = _url.port || 443;
	var sSock = Net.connect(port, _url.hostname, function() {
		cSock.write('HTTP/1.0 200 \r\n\r\n');
		if (reqHeaders && reqHeaders.length) sSock.write(reqHeaders);
		cSock.pipe(sSock);
		sSock.pipe(cSock);
	});
	function onError(err) {
		console.error(TAG, "connect", err);
		cSock.end();
		sSock.end();
	}
	sSock.on('error', onError);
	cSock.on('error', onError);
};

exports.createRequestOpts = createRequestOpts;
exports.transrate = transrate;
exports.doService = transrate;
exports.doConnect = doConnect;
