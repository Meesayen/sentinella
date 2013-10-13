define([
	'lib/text!tpl/app-item.ect',
	'lib/text!tpl/log-message.ect',
	'lib/text!tpl/log-reference.ect',
	'lib/text!tpl/log-object.ect'
], function(
	appItem,
	logMessage,
	logReference,
	logObject
) {

	return {
		'app': {
			'item': appItem
		},
		'log': {
			'message': logMessage,
			'reference': logReference,
			'object': logObject
		}
	};
});
