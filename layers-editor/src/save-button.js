define([ 'jquery', 'message-bus', 'toolbar', 'i18n', './layers-api', 'ui/ui' ], function($, bus, toolbar, i18n, layerRoot, ui) {
	ui.create('button', {
		id: 'save-layers-button',
		parent: toolbar.attr('id'),
		css: 'blue_button toolbar_button',
		html: i18n['layers-editor.save_layers'],
		clickEventCallback: function() {
			bus.send('ajax', {
				type: 'PUT',
				url: 'layers.json',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify(layerRoot.get(), null, 4),
				success: function(data, textStatus, jqXHR) {
					require([ 'text!../layers.json?a=' + new Date().getTime() ], function(newLayerRoot) {
						bus.send('layers-set-root', JSON.parse(newLayerRoot));
					});
				},
				errorMsg: i18n['layers-editor.error_saving']
			});
		}
	});
});
