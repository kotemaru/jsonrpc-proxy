var TAG = "Filter:";

var Glob = require('glob');
var Path = require('path');
var FS = require('fs');
var DateUtils = require('date-utils');
var DocRoot = require('./docroot');

var sLogFile = FS.createWriteStream(DocRoot.getLocalPath("logs/filter.html"));
var sLogCount = 0;

var sApis = {};

function requestListener(req, res) {
	console.log(TAG, req.url);

	var path = req.params.path || req.parsedUrl.pathname;
	var isReset = req.params.reset;
	var isLoad = req.params.load;

	if (isReset) {
		sApis = {};
		res.end();
		return;
	}
	if (!isLoad) {
		return DocRoot.requestListener(req, res);
	}

	load(DocRoot.getLocalPath(path), function(result) {
		var buff = new Buffer(JSON.stringify(result));
		res.setHeader("content-length", buff.length);
		res.write(buff);
		res.end();
	});
}

function load(path, callback) {
	console.log(TAG, 'load', path);
	var apis = sApis;

	Glob(path, function(err, files) {
		var names = [];
		var file = null;
		try {
			for (var i = 0; i < files.length; i++) {
				file = files[i];
				delete require.cache[require.resolve(file)]
				var exports = require(file);
				for ( var name in exports) {
					console.log(TAG, 'load api: method=', name);
					apis[name] = exports[name];
					names.push(name);
				}
			}
			if (callback) callback({
				methods : sApis,
				added : names
			});
		} catch (err) {
			if (callback) callback({
				error : file + ":" + err.toString()
			});
		}
	});
}

function onRpcRequest(req, res, opts) {
	// console.log(TAG, "onRequest ", JSON.stringify(req.body));
	var rpcReqs = Array.isArray(req.body) ? req.body : [ req.body ];
	for (var i = 0; i < rpcReqs.length; i++) {
		var rpcReq = rpcReqs[i];
		var api = sApis[rpcReq.method];
		if (api && api.onRequest) {
			var _this = {};
			api.onRequest.call(_this, rpcReq);
		}
	}
}
function onRpcResponse(req, res, opts) {
	// console.log(TAG, "onResponse ", JSON.stringify(res.body));

	var rpcReqs = Array.isArray(req.body) ? req.body : [ req.body ];
	var rpcRess = Array.isArray(res.body) ? res.body : [ res.body ];
	for (var i = 0; i < rpcReqs.length; i++) {
		var rpcReq = rpcReqs[i];
		var rpcRes = rpcRess[i];
		var api = sApis[rpcReq.method];
		if (api && api.onResponse) {
			var _this = {};
			api.onResponse.call(_this, rpcRes);
			log(rpcReq, rpcRes);
		} else {
			console.log(TAG, "JSONRPC through", "\n  >>", JSON.stringify(rpcReq), "\n  <<", JSON.stringify(rpcRes));
		}
	}
};

function log(rpcReq, rpcRes) {
	var rpcReqStr = JSON.stringify(rpcReq);
	var rpcResStr = JSON.stringify(rpcRes);
	console.log(TAG, "JSONRPC filtered", "\n==>>", rpcReqStr, "\n<<==", rpcResStr);
	try {
		sLogCount++;
		var date = new Date();

		sLogFile.write("\n<li>");
		sLogFile.write(date.toFormat("YYYY/MM/DD HH24:MI:SS"));
		sLogFile.write(" : " + sLogCount + " : ");
		sLogFile.write(rpcReq.method);
		sLogFile.write(" <a href='filter/" + sLogCount + "_req.json'>REQ</a>");
		sLogFile.write(" <a href='filter/" + sLogCount + "_res.json'>RES</a>");

		var dirName = DocRoot.getLocalPath("filter/");
		try {
			FS.mkdirSync(dirName);
		} catch (err) {
			// ignore.
		}
		var out = FS.createWriteStream(dirName + sLogCount + "_req.json");
		out.write(rpcReqStr);
		out.close();
		var out = FS.createWriteStream(dirName + sLogCount + "_res.json");
		out.write(rpcResStr);
		out.close();

	} catch (err) {
		console.error(TAG, "log", err);
	}
}

exports.load = load
exports.requestListener = requestListener;
exports.jsonRpcListener = {
	onRequest : onRpcRequest,
	onResponse : onRpcResponse
};
