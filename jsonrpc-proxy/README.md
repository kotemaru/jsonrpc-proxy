# JSONRPC Proxy

## 概要

汎用JSONRPCプロキシサーバです。<br>
NodeJS v0.10.25 で構成されています。

## 起動方法

NodeJSをインストールして app.js を実行するだけです。

		> node.exe app.js

  * OSには依存しないはずです。
  * デフォルトのポートは 8080 です。

## クライアント側設定

ブラウザのプロキシにこのアプリを設定します。

## フィルタ使い方

### フィルタの定義

docroot/filter の配下に JS ファイルを置いて関数を定義します。

  * docroot/filter/test/test.js


		exports.newsList = {
			onRequest: function(request) {
				request.param.hoge = "test request data";
			},
			onResponse : function(response) {
				if (response.result) {
					response.result.hoge = "test response data";
				}
			}
		};


  * exports のプロパティ名に JSONRPC のメソッド名を指定します。
    * 複数の定義が可能です。
  * onRequest にリクエストパラメータの差し替え関数を設定します。
    * ターゲットサーバにリクエストを転送する前に呼ばれます。
  * onRequest にレスポンスの差し替え関数を設定します。
    * ターゲットサーバからレスポンスを受けた後に呼ばれます。

### フィルタの適用

起動直後にはフィルタは適用されていません。<br>
以下のURLを叩くとフィルタがファイル単位で適用されます。

	http://Proxyサーバ:8080/filter/test/test.js?load=on

フィルタをクリアする場合は以下のURLを叩きます。

	http://Proxyサーバ:8080/filter?reset=on

いずれもProxyサーバのトップページからリンクを辿れます。


### ログ

フィルタ関数を経由した JSONPRC は以下のURLからログを確認できます。

	http://Proxyサーバ:8080/logs/filter.html

Proxyサーバのトップページからリンクを辿れます。<br>
ログはプロキシを再起動すると初期化されます。


# Tools

Created with [Nodeclipse v0.5](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))
