define([ 'jquery', 'i18n', 'customization', 'message-bus', 'layout', 'ui/ui' ], function($, i18n, customization, bus,layout, ui) {
	/*
	 * keep the information about portal 
	 */
	var legendArrayInfo = {};

	var dialogId = 'welcome_panel';

        //create dialog 
	ui.create('dialog', {
		id: dialogId,
		parent: document.body,
		title: i18n.welcome_title,
		closeButton: true
	});

        //Create div content message
	var content = ui.create('div', {
		id: dialogId + '_content',
                html: i18n.welcome_message,
		parent: dialogId
	});

        //load dialog after load layers

	bus.listen('layers-loaded', function(event) {
		bus.send('ui-show', dialogId);
	});



});
