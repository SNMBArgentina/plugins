define([ 'message-bus', 'ui/ui', 'i18n' ], function(bus, ui, i18n) {
	var idDownloadInfo = {};

	function getDownloadLink(obj) {
		if (obj.downloadFile) {
			return 'static/downloads/' + obj.id + '.zip';
		}
		return null;
	}

	var buildLink = function(id, eventName) {
		let link = ui.create('button', {
			id: 'layer_download_button_' + id,
			css: 'layer_download_button layer_action_button',
			tooltip: i18n['tooltip.download_button'],
			clickEventCallback: function() {
				bus.send(eventName, [id]);
			}
		});
		return $(link);
	};

	bus.listen('reset-layers', function() {
		idDownloadInfo = {};
	});

	bus.listen('before-adding-layers', function() {
		let showDownloadLayerAction = function(portalLayer) {
			if (getDownloadLink(portalLayer) !== null) {
				return buildLink(portalLayer.id, 'show-layer-download');
			}
			return null;
		};

		bus.send('register-layer-action', showDownloadLayerAction);
	});

	bus.listen('add-layer', function(event, layerInfo) {
		if (getDownloadLink(layerInfo) !== null) {
			idDownloadInfo['layer-' + layerInfo.id] = {
				'link': getDownloadLink(layerInfo),
				'title': layerInfo.label
			};
		}
	});

	var showDownload = function(id) {
		if (idDownloadInfo.hasOwnProperty(id)) {
			let linkInfo = idDownloadInfo[id];
			bus.send('show-download', [ linkInfo.title, linkInfo.link ]);
		}
	};

	bus.listen('show-layer-download', function(event, layerId) {
		showDownload('layer-' + layerId);
	});
});
