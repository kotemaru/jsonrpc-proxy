
function Editor() {
	this.initialize.apply(this, arguments)
};
(function(Class) {

	Class.load = function(path) {
		var path = FileTree.getCurrentPath();
		if (path == null || path == "") return;

		$editor = $("#editor");
		$.ajax({
			type : "GET",
			dataType : "text",
			url : path,
			success : function(text) {
				$editor.val(text);
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
	};

	Class.save = function(path) {
		var path = FileTree.getCurrentPath();
		if (path == null || path == "") {
			alert("パスがありません。");
			return;
		}
		$editor = $("#editor");

		$.ajax({
			type : "PUT",
			contentType : "text/plain",
			data : $editor.val(),
			url : path,
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
		$.ajax({
			type : "GET",
			dataType : "json",
			data : $editor.val(),
			url : path + "?load=on",
			success : function(json) {
				if (json.error) {
					alert(json.error);
				}
				FilterStatus.refresh();
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
	}

	Class.insertTab = function(o, e) {
		var kC = e.keyCode ? e.keyCode : e.charCode ? e.charCode : e.which;
		if (kC == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey) {
			var oS = o.scrollTop; // Set the current scroll position.
			if (o.setSelectionRange) {
				// For: Opera + FireFox + Safari
				var sS = o.selectionStart;
				var sE = o.selectionEnd;
				o.value = o.value.substring(0, sS) + "\t" + o.value.substr(sE);
				o.setSelectionRange(sS + 1, sS + 1);
				o.focus();
			} else if (o.createTextRange) {
				// For: MSIE
				document.selection.createRange().text = "\t"; // String.fromCharCode(9)
				// o.onblur = function() { o.focus(); o.onblur = null; };
				e.returnValue = false;
			} else {
				alert('Please contact the admin and tell xe that the tab functionality does not work in your browser.');
			}
			o.scrollTop = oS; // Return to the original scroll position.
			if (e.preventDefault) // DOM
			{
				e.preventDefault();
			}
			return false; // Not needed, but good practice.
		}
		return true;
	}
})(Editor);
