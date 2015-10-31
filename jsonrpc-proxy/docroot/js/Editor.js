function Editor() {
	this.initialize.apply(this, arguments)
};
(function(Class) {
	var $EDITOR;
	var $EDITOR_BG;
	var sInitValue = "";
	var sLastValue = "";
	var sCompileRequestCount = 0;
	var sError;

	$(function(){
		$EDITOR = $("#editor");
		$EDITOR_BG = $("#editorBg");
		$EDITOR.bind('keyup', function(ev) {
			var text = $EDITOR.val();
			if (text != sLastValue) Class.setError(null);
			sLastValue = text;
		}).bind('scroll',function(ev){
			$EDITOR_BG.scrollTop($EDITOR.scrollTop());
			$EDITOR_BG.scrollLeft($EDITOR.scrollLeft());
			// console.log("sctoll",$EDITOR_BG.scrollTop(),$EDITOR.scrollTop());
		});
	});

	function setupBgText() {
		if (sError == null) {
			$EDITOR_BG.text();
			$EDITOR_BG.hide();
			return;
		}

		var text = $EDITOR.val();
		var pos = 0;
		var next = 0;
		var lineNo = 0;
		while ((next=text.indexOf('\n',pos))) {
			if (++lineNo == sError.line) break;
			pos = next+1;
		}
		pos = pos + sError.column-1;
		var before = esc(text.substr(0,pos));
		var mark = "<span class='ErrorMark'>"+esc(text.substr(pos,1))+"</span>";
		var after = esc(text.substr(pos+1));
		$EDITOR_BG.html(before+mark+after);
		$EDITOR_BG.show();
		$EDITOR_BG.scrollTop($EDITOR.scrollTop());
		$EDITOR_BG.scrollLeft($EDITOR.scrollLeft());
	}
	function esc(text) {
		return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
	}


	Class.load = function(path) {
		var path = FileTree.getCurrentPath();
		if (path == null || path == "") return;

		if (sInitValue != $EDITOR.val()) {
			if (!confirm("保存されていない編集があります。")) return;
		}

		$.ajax({
			type : "GET",
			dataType : "text",
			url : path,
			success : function(text) {
				$EDITOR.val(text);
				sLastValue = sInitValue = text;
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

		$.ajax({
			type : "PUT",
			contentType : "text/plain",
			data : $EDITOR.val(),
			url : path,
			success : function(json) {
				sInitValue = $EDITOR.val();
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
		$.ajax({
			type : "GET",
			dataType : "json",
			url : path + "?load=on",
			success : function(json) {
				if (json.error) {
					$("#tester").attr("src","/js_loader.html?"+path);
				}
				FilterStatus.refresh();
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
	}

	Class.setError = function (err) {
		sError = err;
		if (err) {
			$("#errorMessage").text(err.message);
		} else {
			$("#errorMessage").text("");
		}
		setupBgText();
	}

	function compile() {
		console.log("compile");
		try {
			eval($EDITOR.val());
		} catch (err) {
			console.error(err.stack);
		}
	}

	function reqeustCompile() {
		sCompileRequestCount++;
		setTimeout(function(){
			if (--sCompileRequestCount > 0) return
			compile();
		},1000);
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
