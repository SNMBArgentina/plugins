define([ 'jquery', 'i18n', 'message-bus', 'layout', 'ui/ui' ], function($, i18n, bus, layout, ui) {
	ui.create('button', {
		id: 'toggle_legend',
		parent: layout.map.attr('id'),
		css: 'blue_button',
		tooltip: i18n['tooltip.legend_button'],
		html: "",
		clickEventName: 'toggle-legend'
	});
});
