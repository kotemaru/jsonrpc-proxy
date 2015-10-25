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

Router.on('GET', null, '/filter', Filter.requestListener);
Router.on('GET', null, '/filter/**/*.js', Filter.requestListener);
Router.on('PUT', null, '/filter/**/*.js', Filter.put);
Router.on('GET', null, '/tree.json', DocRoot.treeListener);
Router.on('GET', null, '/**', DocRoot.requestListener);
Router.on('POST', '*', '/vapi/request', JsonRpc.createListener(Filter.jsonRpcListener));
Router.setDefaultListener(Proxy.requestListener);

var server = Http.createServer();
server.on('request', Router.requestListener);
server.on('connect', Proxy.connectListener);
server.listen(PORT);
WebSocket.listen(server);
console.log("listen porxy", PORT);

Process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err);
});