exports.newsList = {
	onRequest: function(request) {
	},
	onResponse : function(response) {
		if (response.result) {
			response.result.newsArticleList = [ {
				newsArticleId : 10005,
				newsArticleTitle : "おしらせ１",
				nextLinkUrl : "http://www.google.co.jp/",
				newsArticleLinkLabel : "テスト"
			} ];
		}
	}
};