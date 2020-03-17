define([ 'message-bus', 'i18n', 'customization', 'ui/ui' ], function(bus, i18n, customization, ui) {
	var idStatsInfo = {
		'link': 'static/loc/' + customization.languageCode + '/html/stats.html',
		'title': i18n.stats_dialog_title
	};

	function getStatsLink(obj) {
		return obj.hasOwnProperty('stats');
	}

	var buildLink = function(id) {
		var link = ui.create('button', {
			id: 'layer_stats_button_' + id,
			css: 'layer_stats_button layer_action_button',
			clickEventCallback: function() {
				bus.send('show-layer-stats');
			}
		});
		return $(link);
	};

	bus.listen('before-adding-layers', function() {
		var showStatsLayerAction = function(portalLayer) {
			if (getStatsLink(portalLayer)) {
				return buildLink(portalLayer.id);
			}
			return null;
		};

		bus.send('register-layer-action', showStatsLayerAction);
	});

	bus.listen('show-layer-stats', function() {
		bus.send('show-info', [ idStatsInfo.title, idStatsInfo.link ]);
	});
});
