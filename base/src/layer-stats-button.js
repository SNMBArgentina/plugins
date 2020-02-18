define([ 'message-bus', 'customization', 'ui/ui' ], function(bus, customization, ui) {

	let buildButton = function(id) {
		let link = ui.create('button', {
			id: 'layer_stats_button_' + id,
			css: 'layer_stats_button'
		});
		return $(link);
	};

	bus.listen('before-adding-layers', () => {
		let showInfoLayerAction = (portalLayer) => {
			if (portalLayer.stats) {
				return buildButton(portalLayer.id);
			}
			return null;
		};

		bus.send('register-layer-action', showInfoLayerAction);
	});
});
