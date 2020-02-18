define([ 'message-bus', 'ui/ui' ], function(bus, ui) {
	var idDownloadInfo = {};

	function getDownloadLink(obj) {
		if (obj.downloadFile) {
			return 'static/downloads/' + obj.id + '.zip';
		}
		return null;
	}

	var buildLink = function(id, eventName) {
		var link = ui.create('button', {
			id: 'layer_download_button_' + id,
			css: 'layer_download_button',
			clickEventCallback: function() {
				bus.send(eventName, [ id ]);
			}
		});
		return $(link);
	};

	bus.listen('reset-layers', function() {
		idLinkInfo = {};
	});

	bus.listen('before-adding-layers', function() {
		var showDownloadLayerAction = function(portalLayer) {
			if (getDownloadLink(portalLayer) != null) {
				return buildLink(portalLayer.id, 'show-layer-download');
			}
			return null;
		};

		bus.send('register-layer-action', showDownloadLayerAction);
	});

	bus.listen('add-layer', function(event, layerInfo) {
		if (getDownloadLink(layerInfo) != null) {
			idDownloadInfo['layer-' + layerInfo.id] = {
				'link': getDownloadLink(layerInfo),
				'title': layerInfo.label
			};
		}
	});

	var showDownload = function(id) {
		if (idDownloadInfo.hasOwnProperty(id)) {
			var linkInfo = idDownloadInfo[id];
			bus.send('show-download', [ linkInfo.title, linkInfo.link ]);
		}
	};

	bus.listen('show-layer-download', function(event, layerId) {
		showDownload('layer-' + layerId);
	});
});
