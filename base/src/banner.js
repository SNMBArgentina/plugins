define([ 'jquery', 'layout', 'i18n', 'message-bus', 'module', 'ui/ui' ], function($, layout, i18n, bus, module, ui) {
	var config = module.config();

	if (!config.hide) {
		ui.create('div', {
			id: 'banner',
			parent: layout.header.attr('id'),
			priority: 1
		});

		if (config['show-flag']) {
			ui.create('div', {
				id: 'flag',
				parent: 'banner'
			});
		}

		if (config['show-logos']) {
			ui.create('div', {
				id: 'logos',
				parent: 'banner'
			});
		}

		ui.create('div', {
			id: 'title',
			parent: 'banner',
			html: i18n.title
		});
	}
});
