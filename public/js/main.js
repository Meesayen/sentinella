requirejs.config({
	baseUrl: 'js',
	paths: {
		tpl: '../templates'
	}
});

requirejs([
	'ctrl/log-center'
], function(
	App
) {
	var app = new App();
	app.run();
	window.onunload = function() {
		source.close();
	};
});
