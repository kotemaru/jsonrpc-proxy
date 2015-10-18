var TAG = "Router:"

var Http = require('http');
var Url = require('url');
var Net = require('net');
var Minimatch = require("minimatch").Minimatch
var QueryString = require('querystring');

var sDefaultListener = null;

var sListenerInfoRoot = {
	next : null
};
var NOCASE_OPT = {
	nocase : true
}

function setDefaultListener(listner) {
	sDefaultListener = listner;
}

function addListener(method, host, path, listener) {
	var info = {
		next : null,
		method : method,
		host : (host == null) ? null : new Minimatch(host, NOCASE_OPT),
		path : new Minimatch(path),
		listener : listener,
	};
	var prev = sListenerInfoRoot;
	while (prev && prev.next) prev = prev.next;
	prev.next = info;
}

function getListener(req) {
	var url = Url.parse(req.url);
	req.parsedUrl = url;
	req.params = QueryString.parse(url.query);
	var host = url.host; // || req.headers.host

	var info = sListenerInfoRoot.next;
	while (info && info.method) {
		var isHostMatch = (info.host == null) ? (host == null) : (host != null && info.host.match(host));
		//console.log(TAG,req.method, req.method == info.method,":",host,isHostMatch ,":",url.pathname, info.path.match(url.pathname))
		if (req.method == info.method && isHostMatch && info.path.match(url.pathname)) {
			return info.listener;
		}
		info = info.next;
	}
	return sDefaultListener;
}

function requestListener(req, res) {
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
exports.requestListener = requestListener;
