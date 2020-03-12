define([ 'jquery', 'message-bus', 'layout', 'ui/ui' ], function($, bus, layout, ui) {
	ui.create('button', {
		id: 'zoom_out',
		parent: layout.map.attr('id'),
		clickEventName: 'zoom-out'
	});
	ui.create('button', {
		id: 'zoom_in',
		parent: layout.map.attr('id'),
		clickEventName: 'zoom-in'
	});
	ui.create('button', {
		id: 'zoom_to_max_extent',
		parent: layout.map.attr('id'),
		clickEventName: 'initial-zoom'
	});
});
