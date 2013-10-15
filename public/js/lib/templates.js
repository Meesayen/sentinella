define([
	'lib/text!tpl/app-item.ect',
	'lib/text!tpl/log-message.ect',
	'lib/text!tpl/log-reference.ect',
	'lib/text!tpl/log-object.ect',
	'lib/text!tpl/user-carousel.ect'
], function(
	appItem,
	logMessage,
	logReference,
	logObject,
	userCarousel,
	userList
) {

	return {
		'app': {
			'item': appItem
		},
		'log': {
			'message': logMessage,
			'reference': logReference,
			'object': logObject
		},
		'comp': {
			'user-carousel': userCarousel
		}
	};
});
