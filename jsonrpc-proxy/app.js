var TAG = "app:"
var Process = require('process');
var Http = require('http');
var Url = require('url');
var QueryString = require('querystring');

var Router = require('./src/router');
var Proxy = require('./src/proxy')
var JsonRpc = require('./src/jsonrpc');
var Filter = require('./src/filter');
var DocRoot = require('./src/docroot');
var WebSocket = require('./src/websocket');

var PORT = 8080;

// HTTPルーティング設定
Router.on('GET', null, '/filter', Filter.doGet);
Router.on('GET', null, '/filter/**/*.js', Filter.doGet);
Router.on('PUT', null, '/filter/**/*.js', Filter.doPut);
Router.on('GET', null, '/tree.json', DocRoot.doGetTree);
Router.on('GET', null, '/**', DocRoot.doGet);
Router.on('POST', '*', '/vapi/request', JsonRpc.createListener(Filter.jsonRpcListener));
Router.setDefaultListener(Proxy.doService);

// HTTPサーバ作成
var server = Http.createServer();
server.on('request', Router.doService);
server.on('connect', Proxy.doConnect);
server.listen(PORT);

// ログ用WebSocketサーバ作成
WebSocket.listen(server);

// クラッシュ回避用。
Process.on('uncaughtException', function(err) {
	console.error('Caught exception: ', err, err.stack);
});

console.log("listen porxy", PORT);
