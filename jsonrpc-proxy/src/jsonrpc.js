/**
 * JSONRPCをフックするモジュール
 */

var Http = require('http');
var Proxy = require('./proxy')
var Done = require('./done');

var TAG = "JsonRpc:"

/**
 * JSONRPCをフックするHTTPリスナを生成して返す。
 * <li>option
 * <ul>
 * <li>onRequest: function(req, res)  JSONRPCリクエストイベントリスナ
 * <li>onResponse: function(req, res) JSONRPCレスポンスイベントリスナ
 * </ul>
 * <li> イベントリスナ関数の戻り値が true の場合、自力で応答を行った物とし継続処理を行わない。
 * <li> JSONデータでなければ通常のProxy処理を行う。
 * @param option
 * @returns {Function} HTTPリスナ
 */
function createListener(option) {
	var _this = {};

	function proxyHandler(req, res) {
		var ctype = req.headers['content-type'];
		if (ctype.indexOf("application/json") == -1) {
			Proxy.transrate(req, res);
			return;
		}

		req.rawBody = "";
		req.on('data', function(chunk) {
			req.rawBody += chunk;
		});

		req.on('end', function() {
			req.body = JSON.parse(req.rawBody);
			var isDone = false;
			if (option.onRequest) {
				isDone = option.onRequest.call(_this, req, res);
			}
			if (!isDone) {
				proxyRequest(req, res);
			}
		});
	}

	function proxyRequest(req, res) {
		// console.log(TAG, "doRequest ", JSON.stringify(req.body));
		var opts = Proxy.createRequestOpts(req);

		var buff = new Buffer(JSON.stringify(req.body));
		opts.headers['content-length'] = buff.length;

		var svrReq = Http.request(opts, function(svrRes) {
			res.statusCode = svrRes.statusCode;
			for ( var key in svrRes.headers) {
				res.setHeader(key, svrRes.headers[key]);
			}

			res.rawBody = "";
			svrRes.on('data', function(chunk) {
				res.rawBody += chunk;
			});

			svrRes.on('end', function() {
				res.body = JSON.parse(res.rawBody);
				var isDone = false;
				if (option.onResponse) {
					isDone = option.onResponse.call(_this, req, res);
				}
				if (!isDone) {
					Done.json(res, res.body);
				}
			});
		});
		svrReq.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});

		svrReq.write(buff);
		svrReq.end();
		return true;
	}

	return proxyHandler;
}

exports.createListener = createListener;
