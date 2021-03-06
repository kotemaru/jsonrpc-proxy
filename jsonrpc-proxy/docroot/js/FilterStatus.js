
function FilterStatus() {
	this.initialize.apply(this, arguments)
};
(function(Class) {

	Class.refresh = function() {
		$sEditor = $("#editor");

		$.ajax({
			type : "GET",
			dataType : "json",
			url : "/filter?cmd=status",
			success : function(data) {
				var $elem = $("#filterList");
				$elem.html("");
				for (var name in data) {
					$elem.append($("<div>"+name+"</div>"));
				}
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
	};
	Class.clean = function() {
		$sEditor = $("#editor");

		$.ajax({
			type : "GET",
			dataType : "json",
			url : "/filter?cmd=reset",
			success : function(data) {
				Class.refresh();
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
				Class.refresh();
			}
		});
	};

})(FilterStatus);
