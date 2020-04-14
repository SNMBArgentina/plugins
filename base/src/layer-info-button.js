define([ 'message-bus', 'customization', 'ui/ui' ], function(bus, customization, ui) {
	var idLinkInfo = {};

	function getInfoLink(obj) {
		if (obj.infoLink) {
			return obj.infoLink;
		} else if (obj.infoFile) {
			return 'static/loc/' + customization.languageCode + '/html/' + obj.infoFile;
		}
		return null;
	}

	var buildLink = function(id, eventName) {
		var link = ui.create('button', {
			id: 'layer_info_button_' + id,
			css: 'layer_info_button',
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
		var showInfoLayerAction = function(portalLayer) {
			if (getInfoLink(portalLayer) != null) {
				return buildLink(portalLayer.id, 'show-layer-info');
			}
			return null;
		};
		var showInfoGroupAction = function(group) {
			if (getInfoLink(group) != null) {
				return buildLink(group.id, 'show-group-info');
			}
			return null;
		};

		bus.send('register-layer-action', showInfoLayerAction);
		bus.send('register-group-action', showInfoGroupAction);
	});

	bus.listen('add-layer', function(event, layerInfo) {
		if (getInfoLink(layerInfo) != null) {
			idLinkInfo['layer-' + layerInfo.id] = {
				'link': getInfoLink(layerInfo),
				'title': layerInfo.label
			};
		}
	});

	bus.listen('add-group', function(event, groupInfo) {
		if (getInfoLink(groupInfo) != null) {
			idLinkInfo['group-' + groupInfo.id] = {
				'link': getInfoLink(groupInfo),
				'title': groupInfo.label
			};
		}
	});

	var showInfo = function(id) {
		if (idLinkInfo.hasOwnProperty(id)) {
			var linkInfo = idLinkInfo[id];
			bus.send('show-info', [ linkInfo.title, linkInfo.link ]);
		}
	};

	bus.listen('show-layer-info', function(event, layerId) {
		showInfo('layer-' + layerId);
	});

	bus.listen('show-group-info', function(event, groupId) {
		showInfo('group-' + groupId);
	});
});
