/**
 * JSON-PRC 用フィルタ管理。
 * <li>フィルタJSファイルの管理。
 * <li>フィルタの実行管理。
 */

var TAG = "Filter:";

var Glob = require('glob');
var Path = require('path');
var FS = require('fs');
var DateUtils = require('date-utils');
var DocRoot = require('./docroot');
var WebSocket = require('./websocket');
var Done = require('./done');

/**
 * 現在有効なフィルタ。
 * <li>key="JSONRPCメソッド名", value={onRequest:function, onRespons:function}
 */
var sActiveFilters = {
// "メソッド名" : {onRequest:function(){}, onRespons:function(){}}
};

var sLogCount = 0;
var sLogs = [];

/**
 * HTTPリスナ：フィルタJSファイルの操作を行う。
 * <li>クエリ引数：cmd
 * <ul>
 * <li>load: パスのJSファイルを有効なフィルタに追加する。
 * <li>reset: 有効なフィルタをクリアする。
 * <li>status: 現在有効なフィルタの一覧をJSONで応答する。
 * <li>無し: JSファイルを応答する。
 *
 * @param req
 * @param res
 */
function doGet(req, res) {
	console.log(TAG, req.url);
	switch (req.params.cmd) {
	case "reset":
		sActiveFilters = {};
		res.end();
		break;
	case "status":
		doGetStatus(req, res);
		break;
	case "load":
		var path = req.params.path || req.parsedUrl.pathname;
		load(DocRoot.getLocalPath(path), function(result) {
			Done.json(res, result);
		});
		break;
	default:
		DocRoot.doGet(req, res);
		break;
	}
}

/**
 * 現在有効なフィルタの一覧をJSONで応答する。
 *
 * @param req
 * @param res
 */
function doGetStatus(req, res) {
	console.log(TAG, req.url);
	var names = {};
	for ( var name in sActiveFilters) {
		names[name] = {
			onRequest : sActiveFilters[name].onRequest ? true : false,
			onResponse : sActiveFilters[name].onResponse ? true : false
		};
	}
	Done.json(res, names);
}

/**
 * JSファイルを有効なフィルタに追加する。
 * <li>エラーが有った場合は、callbackにerror項目が存在する。
 *
 * @param path JSファイルの物理パス。glob形式のパターンが使える。
 * @param callback function({added:[], error:{}})
 */
function load(path, callback) {
	console.log(TAG, 'load', path);

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
					sActiveFilters[name] = exports[name];
					names.push(name);
				}
			}
			if (callback) callback({
				added : names
			});
		} catch (err) {
			if (callback) callback({
				added : names,
				error : {
					file : file,
					message : err.message
				}
			});
		}
	});
}

/**
 * HTTPリスナ：JSファイルの書き込みを行う。
 * <li>クエリ：無し
 * <li>urlのパスのファイルをリクエストボディで置き換える。
 * <li>Content-type: text/* 以外では動作しない。
 */
function doPut(req, res) {
	var path = DocRoot.getLocalPath(req.parsedUrl.pathname);
	var ctype = req.headers['content-type'];
	console.log(TAG, "PUT", path, ctype);

	if (ctype.indexOf("text/") != 0) {
		return Done.error(res, 400, "Unknown Content-type:" + ctype);
	}

	var body = "";

	req.on('data', function(chunk) {
		body += chunk;
	});
	req.on('end', function() {
		if (body == "") {
			return Done.error(res, 400, "Not found body. Content-type:" + ctype);
		}

		mkdir(Path.dirname(path));
		FS.writeFile(path, body, null, function(err) {
			if (err) {
				Done.error(res, 400, err.message);
			} else {
				res.end();
			}
		});
	});
}

function mkdir(localPath) {
	try {
		FS.mkdirSync(Path.dirname(localPath));
	} catch (e) {
		// ignore.
	}
}

// ----------------------------------------------------
// 実行系制御

/**
 * JSONRPCのrequestイベントリスナ。
 * <li>JSONRPCメソッド名から現在有効なフィルタをチェックし存在すればフィルタを実行する。
 */
function onRpcRequest(req, res, opts) {
	var self = this;
	// console.log(TAG, "onRequest ", JSON.stringify(req.body));
	var rpcReqs = Array.isArray(req.body) ? req.body : [ req.body ];
	for (var i = 0; i < rpcReqs.length; i++) {
		var rpcReq = rpcReqs[i];
		try {
			var api = sActiveFilters[rpcReq.method];
			if (api && api.onRequest) {
				api.onRequest.call(self, rpcReq);
			}
		} catch (err) {
			log(rpcReq, null, err);
		}
	}
}

/**
 * JSONRPCのresponseイベントリスナ。
 * <li>JSONRPCメソッド名から現在有効なフィルタをチェックし存在すればフィルタを実行する。
 * <li>結果をログに出力する。
 */
function onRpcResponse(req, res, opts) {
	// console.log(TAG, "onResponse ", JSON.stringify(res.body));
	var self = this;
	var rpcReqs = Array.isArray(req.body) ? req.body : [ req.body ];
	var rpcRess = Array.isArray(res.body) ? res.body : [ res.body ];
	for (var i = 0; i < rpcReqs.length; i++) {
		var rpcReq = rpcReqs[i];
		var rpcRes = rpcRess[i];
		try {
			var api = sActiveFilters[rpcReq.method];
			if (api && api.onResponse) {
				self.request = rpcReq;
				api.onResponse.call(self, rpcRes);
				log(rpcReq, rpcRes);
			} else {
				console.log(TAG, "JSONRPC through", "\n  >>", JSON.stringify(rpcReq), "\n  <<", JSON.stringify(rpcRes));
			}
		} catch (err) {
			log(rpcReq, rpcRes, err);
		}
	}
};

/**
 * フィルタの実行結果ログ。
 * <li>JSONRPCリクエスト/レスポンスを docroot/logs/filter/{sLogCount}_{req|res}.json に出力する。
 * <li>ログのインデックスをオンメモリで記録し WebSocket で通知する。
 * @param rpcReq JSONRPCリクエスト
 * @param rpcRes JSONRPCレスポンス
 * @param err 実行エラー
 */
function log(rpcReq, rpcRes, err) {
	var rpcReqStr = JSON.stringify(rpcReq);
	var rpcResStr = (rpcRes == null) ? "No response" : JSON.stringify(rpcRes);
	console.log(TAG, "JSONRPC filtered", "\n==>>", rpcReqStr, "\n<<==", rpcResStr);
	try {
		sLogCount++;
		var date = new Date();
		var dirName = DocRoot.getLocalPath("logs/filter/");
		mkdir(dirName);

		var out = FS.createWriteStream(dirName + sLogCount + "_req.json");
		out.write(rpcReqStr);
		out.close();
		var out = FS.createWriteStream(dirName + sLogCount + "_res.json");
		out.write(rpcResStr);
		out.close();

		var logMsg = {
			id : sLogCount,
			datetime : date.toFormat("YYYY/MM/DD HH24:MI:SS"),
			method : rpcReq.method,
			request : "/logs/filter/" + sLogCount + "_req.json",
			response : "/logs/filter/" + sLogCount + "_res.json"
		};
		if (err) {
			logMsg.error = {
				message : err.message,
				stack : err.stack
			};
		}
		sLogs.push(logMsg);
		WebSocket.emit('filter.apply', logMsg); // brodcast
	} catch (err) {
		console.error(TAG, "log", err);
	}
}

/**
 * オンメモリで記録されていたログを全て通知する。
 * <li>ロガークライアントが接続してきた時に実行。
 * @param socket WebSocket
 */
function sendPastLogs(socket) {
	for (var i = 0; i < sLogs.length; i++) {
		socket.emit('filter.apply', sLogs[i]);
	}
}

exports.load = load
exports.doGet = doGet;
exports.doPut = doPut;
exports.jsonRpcListener = {
	onRequest : onRpcRequest,
	onResponse : onRpcResponse
};
exports.sendPastLogs = sendPastLogs;
