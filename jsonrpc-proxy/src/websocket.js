var TAG = "WebSocket:"
var Http = require('http');
var Url = require('url');
var QueryString = require('querystring');
var SocketIo = require('socket.io');

var sWebSocket;
exports.listen = function(server) {
	sWebSocket = SocketIo.listen(server).sockets;

	sWebSocket.on('connection', function(sock) {
		var params = QueryString.parse(Url.parse("http://localhost/" + sock.request.url).query);
		var events = params.events;
		console.log(TAG, "connect events=", events);

		sock.on('disconnect', function() {
			console.log(TAG, "disconnect");
		});
	});
}

exports.send = function(event, msg) {
	sWebSocket.emit(event.msg);
}


