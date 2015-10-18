var Http = require('http');
var Proxy = require('./proxy')

var TAG = "JsonRpc:"

function createListener(option) {

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
				var _this = {
					proxyRequest : proxyRequest,
					doResponse : doResponse
				};
				isDone = option.onRequest.call(_this, req, res);
			}
			if (!isDone) {
				proxyRequest(req, res);
			}
		});
	}

	function proxyRequest(req, res) {
		//console.log(TAG, "doRequest ", JSON.stringify(req.body));
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
					var _this = {
						proxyRequest : proxyRequest,
						doResponse : doResponse
					};
					isDone = option.onResponse.call(_this, req, res);
				}
				if (!isDone) {
					doResponse(req, res);
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

	function doResponse(req, res) {
		//console.log(TAG, "doResponse ", JSON.stringify(res.body));
		var buff = new Buffer(JSON.stringify(res.body));
		res.setHeader("content-length", buff.length);
		res.write(buff);
		res.end();
		return true;
	}
	return proxyHandler;
}

exports.createListener = createListener;
