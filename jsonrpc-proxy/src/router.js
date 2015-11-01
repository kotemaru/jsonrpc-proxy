/**
 * HTTPリクエストのルーティング用モジュール。
 */

var TAG = "Router:"

var Http = require('http');
var Url = require('url');
var Net = require('net');
var Minimatch = require("minimatch").Minimatch
var QueryString = require('querystring');

var sDefaultListener = null;

/**
 * ルーティング・テーブル。LinkedList構造。
 */
var sListenerInfoRoot = {
	next : null
// method : "HTTPメソッド"
// host : "ホスト名パターン" 例："*.goole.co.jp"、null=自ホスト
// path : "パスパターン" 例："/filter/**/*.js"
// listener : HTTPリスナ関数,
};
var NOCASE_OPT = {
	nocase : true
}

/**
 * デフォルトのHTTPリスナを登録。必須。
 *
 * @param listner
 */
function setDefaultListener(listner) {
	sDefaultListener = listner;
}

/**
 * HTTPリスナ関数をルーティング・テーブル登録する。
 * <li>各種マッチ・パターンを指定する。
 *
 * @param method HTTPメソッド。"GET","POST",etc
 * @param host ホスト名パターン。 例："*.goole.co.jp"、null=自ホスト
 * @param path パスパターン、 例："/filter/＊＊/＊.js"
 * @param listener HTTPリスナ関数,
 */
function addListener(method, host, path, listener) {
	var info = {
		next : null,
		method : method,
		host : (host == null) ? null : new Minimatch(host, NOCASE_OPT),
		path : new Minimatch(path),
		listener : listener,
	};
	var prev = sListenerInfoRoot;
	while (prev && prev.next)
		prev = prev.next;
	prev.next = info;
}

/**
 * HTTPリクエストからHTTPリスナ関数を取得する。
 * <li>ルーティング・テーブルを登録順に検索して一致したものを返す。
 * <li>条件の広いものを後から登録する必要が有ることに注意。
 *
 * @param req
 * @returns HTTPリスナ関数
 */
function getListener(req) {
	var url = Url.parse(req.url);
	req.parsedUrl = url;
	req.params = QueryString.parse(url.query);
	var host = url.host; // || req.headers.host

	var info = sListenerInfoRoot.next;
	while (info && info.method) {
		var isHostMatch = (info.host == null) ? (host == null) : (host != null && info.host.match(host));
		// console.log(TAG,req.method, req.method == info.method,":",host,isHostMatch ,":",url.pathname,
		// info.path.match(url.pathname))
		if (req.method == info.method && isHostMatch && info.path.match(url.pathname)) {
			return info.listener;
		}
		info = info.next;
	}
	return sDefaultListener;
}

/**
 * ルーティング・テーブルにしたがってHTTPリスナを実行する。
 * @param req
 * @param res
 */
function doService(req, res) {
	console.log(TAG, req.url);
	var listener = getListener(req);
	if (listener == null) {
		console.warn(TAG, "No listener", req.url);
		return;
	}
	listener(req, res);
}

exports.on = addListener;
exports.addListener = addListener;
exports.getListener = getListener;
exports.setDefaultListener = setDefaultListener;
exports.doService = doService;
