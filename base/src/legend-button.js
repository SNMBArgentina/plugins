define([ 'jquery', 'i18n', 'message-bus', 'layout', 'ui/ui' ], function($, i18n, bus, layout, ui) {
	ui.create('button', {
		id: 'toggle_legend',
		parent: layout.map.attr('id'),
		css: 'blue_button',
		html: i18n.legend_button,
		clickEventName: 'toggle-legend'
	});
});
