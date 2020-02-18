define([ 'message-bus', 'customization', 'ui/ui' ], function(bus, customization, ui) {
	let idLinkInfo = {};

	let buildLink = function(id) {
		let link = ui.create('button', {
			id: 'layer_stats_button_' + id,
			css: 'layer_stats_button'
		});
		return $(link);
	};

	bus.listen('reset-layers', () => {
		idLinkInfo = {};
	});

	bus.listen('before-adding-layers', () => {
		let showInfoLayerAction = (portalLayer) => {
			if (portalLayer.stats) {
				return buildLink(portalLayer.id);
			}
			return null;
		};

		bus.send('register-layer-action', showInfoLayerAction);
	});
});
