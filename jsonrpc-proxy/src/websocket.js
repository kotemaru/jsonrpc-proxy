var TAG = "WebSocket:"
var Http = require('http');
var Url = require('url');
var QueryString = require('querystring');
var SocketIo = require('socket.io');

var sWebSocket;
//var sSockets = [];
exports.listen = function(server) {
	sWebSocket = SocketIo.listen(server).sockets;

	sWebSocket.on('connection', function(sock) {
		var params = QueryString.parse(Url.parse("http://localhost/" + sock.request.url).query);
		var events = params.events;
		console.log(TAG, "connect events=", events);
		//sSockets.push(sock);
		//exports.send("filter.apply", {id:0, method:"connect"});
		exports.send('filter.apply', {
			id : 0,
			datetime : "YYYY/MM/DD HH24:MI:SS",
			method : "dummy",
			request : "/logs/filter/1_req.json",
			response : "/logs/filter/1_res.json"
		});
		sock.on('disconnect', function() {
			console.log(TAG, "disconnect");
			//sSocket.delete(sock);
		});
	});
}

exports.send = function(event, msg) {
	console.log(TAG, "send",event,msg);
	sWebSocket.emit(event, msg);
	//for (var i=0; i<sSockets.length; i++) {
	//	sSockets[i].emit(event, msg);
	//}
}


