function FileTree() {
	this.initialize.apply(this, arguments)
};
(function(Class) {

	Class.refresh = function(path, opts) {
		path = path ? path : sCurrentPath;
		$sEditor = $("#editor");

		$.ajax({
			type : "GET",
			dataType : "json",
			url : "/tree.json?path=" + path,
			success : function(data) {
				var $fileTree = $("#fileTree");
				var $ul = $("<ul></ul>");
				$fileTree.html($ul);
				$fileTree.append($ul);
				makeTree($ul, data);
				if (opts && opts.isFirst) Class.load();
			},
			error : function(xhr, status, err) {
				alert(xhr.responseText);
			}
		});
	};

	function makeTree($parent, files) {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];

			var $li;
			if (file.children) {
				$li = $("<li class='FileTreeDirItem' ><img src='/img/folder.png'/><span>" + file.name + "/</span></li>");
				var $ul = $("<ul></ul>");
				makeTree($ul, file.children);
				$li.append($ul);
				$ul.hide();
			} else {
				$li = $("<li class='FileTreeFileItem'><img src='/img/file.png'/><span>" + file.name + "</span></li>");
			}
			$li.data("file", file);
			$parent.append($li);
		}
	}

	function getPng(isOpend) {
		return isOpend ? "/img/folder-open.png" : "/img/folder.png";
	}

	$(".FileTreeDirItem>img").live("click", function(ev) {
		var $this = $(this);
		var $ul = $this.parent().children("ul");
		$ul.toggle();
		$this.attr("src", getPng($ul.is(":visible")));
		Class.save();
	});

	$(".FileTreeFileItem").live("click", function(ev) {
		var $this = $(this);
		var file = $this.data("file");
		$("#currentPath").val(file.absPath);
		Editor.load();
	});

	Class.getCurrentPath = function() {
		return $("#currentPath").val();
	}
	// ----------------------------------------------------------
	var STORAGE_NAME = "FileTree";

	Class.save = function() {
		var isOpend = {};
		$(".FileTreeDirItem").each(function() {
			var $this = $(this);
			var $ul = $this.children("ul");
			var file = $this.data("file");
			isOpend[file.absPath] = $ul.is(":visible");
		});
		var saveData = {
			isOpend : isOpend
		};
		Storage.put(STORAGE_NAME, saveData);
		return Class;
	}
	Class.load = function() {
		var data = Storage.get(STORAGE_NAME, null);
		if (data == null) return Class;
		$(".FileTreeDirItem").each(function() {
			var $this = $(this);
			var $ul = $this.children("ul");
			var file = $this.data("file");
			if (data.isOpend[file.absPath]) {
				$ul.show();
			} else {
				$ul.hide();
			}
			var $img = $this.children("img");
			$img.attr("src", getPng($ul.is(":visible")));
		});
		return Class;
	}

})(FileTree);
