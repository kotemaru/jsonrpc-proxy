/**
 * ログ用WebSocket管理。
 */

var TAG = "WebSocket:"
var Http = require('http');
var Url = require('url');
var QueryString = require('querystring');
var SocketIo = require('socket.io');
var Filter = require('./filter');

var sWebSocket;

/**
 * WebSocket接続受付。
 * <li>既存のログを全て送信する。
 */
exports.listen = function(server) {
	sWebSocket = SocketIo.listen(server).sockets;

	sWebSocket.on('connection', function(sock) {
		var params = QueryString.parse(Url.parse("http://localhost/" + sock.request.url).query);
		var events = params.events;
		console.log(TAG, "connect events=", events);
		sock.emit('filter.apply', {
			id : 0,
			datetime : "YYYY/MM/DD HH:MI:SS",
			method : "dummy",
			request : "/logs/filter/1_req.json",
			response : "/logs/filter/1_res.json"
		});
		Filter.sendPastLogs(sock);
		sock.on('disconnect', function() {
			console.log(TAG, "disconnect");
		});
	});
}

/**
 * 全ての接続にメッセージを送信する。
 */
exports.emit = function(event, msg) {
	console.log(TAG, "send",event,msg);
	sWebSocket.emit(event, msg);
}


