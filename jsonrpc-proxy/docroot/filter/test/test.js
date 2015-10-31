exports.newsList = {



















	onRequest: function(request) {
	}
	onResponse : function(response) {
response.xxx.xxx = 1; 
		if (response.result) {
			response.result.newsArticleList = [ {
				newsArticleId : 10005,
				newsArticleTitle : "おしらせ１",
				nextLinkUrl : "http://www.google.co.jp/",
				newsArticleLinkLabel : "会員ランクに応じてポイントが当たる!"
			} ];
		}
	}
};