requirejs.config({
	baseUrl: 'js',
	paths: {
		tpl: '../templates'
	}
});

requirejs([
	'ctrl/sentinella',
	'lib/logger'
], function(
	App,
	Logger
) {

	window.Logger = Logger;

	var app = new App();
	app.run();

	window.onunload = function() {
		source.close();
	};
});
