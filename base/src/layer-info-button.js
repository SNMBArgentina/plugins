define(['message-bus', 'customization', 'ui/ui', 'i18n'], function(bus, customization, ui, i18n) {
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
		let link = ui.create('button', {
			id: 'layer_info_button_' + id,
			css: 'layer_info_button layer_action_button',
			tooltip: i18n['tooltip.info_button'],
			clickEventCallback: function() {
				bus.send(eventName, [id]);
			}
		});
		return $(link);
	};

	bus.listen('reset-layers', function() {
		idLinkInfo = {};
	});

	bus.listen('before-adding-layers', function() {
		let showInfoLayerAction = function(portalLayer) {
			if (getInfoLink(portalLayer) !== null) {
				return buildLink(portalLayer.id, 'show-layer-info');
			}
			return null;
		};
		let showInfoGroupAction = function(group) {
			if (getInfoLink(group) !== null) {
				return buildLink(group.id, 'show-group-info');
			}
			return null;
		};

		bus.send('register-layer-action', showInfoLayerAction);
		bus.send('register-group-action', showInfoGroupAction);
	});

	bus.listen('add-layer', function(event, layerInfo) {
		if (getInfoLink(layerInfo) !== null) {
			idLinkInfo['layer-' + layerInfo.id] = {
				'link': getInfoLink(layerInfo),
				'title': layerInfo.label
			};
		}
	});

	bus.listen('add-group', function(event, groupInfo) {
		if (getInfoLink(groupInfo) !== null) {
			idLinkInfo['group-' + groupInfo.id] = {
				'link': getInfoLink(groupInfo),
				'title': groupInfo.label
			};
		}
	});

	var showInfo = function(id) {
		if (idLinkInfo.hasOwnProperty(id)) {
			const linkInfo = idLinkInfo[id];
			bus.send('show-info', [linkInfo.title, linkInfo.link]);
		}
	};

	bus.listen('show-layer-info', function(event, layerId) {
		showInfo('layer-' + layerId);
	});

	bus.listen('show-group-info', function(event, groupId) {
		showInfo('group-' + groupId);
	});
});
