define([ 'jquery', 'message-bus', 'customization', 'module' ], function($, bus, customization, module) {
	var defaultServer;
	var layerRoot;
	var original;

	function findById(array, id) {
		var ret = null;
		array.forEach(function f(item) {
			if (item.id == id) {
				ret = item;
			} else if (item.hasOwnProperty('items')) {
				item.items.forEach(f);
			}
		});
		return ret;
	}

	function getGetLegendGraphicUrl(wmsLayer) {
		var url = wmsLayer.baseUrl;

		if (url instanceof Array) {
			url = url[0];
		}

		if (url.indexOf('?') === -1) {
			url = url + '?';
		} else {
			url = url + '$';
		}
		url += 'REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&TRANSPARENT=true&LAYER=';
		url += wmsLayer.wmsName;

		return url;
	}

	function checkMandatoryParameter(wmsLayer, propertyName) {
		if (!wmsLayer.hasOwnProperty(propertyName)) {
			bus.send('error', propertyName + " mandatory when queryType='wfs', in layer: " + wmsLayer.id);
		}
	}

	function processMapLayer(mapLayer, mapLayers) {
		mapLayer.zIndex = mapLayers.indexOf(mapLayer);
		var url;
		if (mapLayer.baseUrl) {
			if (mapLayer.baseUrl instanceof Array) {
				for (var i = 0; i < mapLayer.baseUrl.length; i++) {
					if (mapLayer.baseUrl[i].charAt(0) == '/') {
						mapLayer.baseUrl[i] = defaultServer + mapLayer.baseUrl[i];
					}
				}
				url = mapLayer.baseUrl[0];
			} else {
				if (mapLayer.baseUrl.charAt(0) == '/') {
					mapLayer.baseUrl = defaultServer + mapLayer.baseUrl;
				}
				url = mapLayer.baseUrl;
			}
		}

		if (!mapLayer.queryUrl) {
			mapLayer.queryUrl = url;
		}

		if (mapLayer.legend) {
			mapLayerType = mapLayer.type || 'wms';
			if (mapLayer.legend == 'auto' && mapLayerType == 'wms') {
				mapLayer.legendURL = getGetLegendGraphicUrl(mapLayer);
			} else {
				mapLayer.legendURL = 'static/loc/' + customization.languageCode + '/images/' + mapLayer.legend;
			}
		}

		// Check info parameters
		if (mapLayer.hasOwnProperty('queryType') && mapLayer.queryType == 'wfs') {
			checkMandatoryParameter(mapLayer, 'queryGeomFieldName');
			checkMandatoryParameter(mapLayer, 'queryFieldNames');
			checkMandatoryParameter(mapLayer, 'queryFieldAliases');
		}
	}

	function processPortalLayer(groupId, id) {
		var portalLayer = findById(layerRoot.portalLayers, id);
		if (portalLayer == null) {
			bus.send('error', "Portal layer with id '" + id + "' not found");
			return;
		}

		portalLayer.groupId = groupId;
		if (portalLayer.timeInstances) {
			portalLayer.timestamps = portalLayer.timeInstances.split(',');
		}

		var layerInfoArray = [];
		if (portalLayer.layers) {
			portalLayer.layers.forEach(function(mapLayerId) {
				var mapLayer = findById(layerRoot.wmsLayers, mapLayerId);
				if (mapLayer !== null) {
					processMapLayer(mapLayer, layerRoot.wmsLayers);
					layerInfoArray.push(mapLayer);
				} else {
					bus.send('error', "Map layer '" + mapLayerIds[j] + "' not found");
				}
			});
		}
		portalLayer.mapLayers = layerInfoArray;

		if (portalLayer.inlineLegendUrl) {
			if (portalLayer.inlineLegendUrl == 'auto') {
				var mapLayers = portalLayer.mapLayers;
				mapLayerType = mapLayers[0].type || 'wms';
				if (mapLayers.length > 0 && mapLayerType == 'wms') {
					portalLayer.inlineLegendUrl = getGetLegendGraphicUrl(mapLayers[0]);
				} else {
					portalLayer.inlineLegendUrl = null;
				}
			} else if (portalLayer.inlineLegendUrl.charAt(0) == '/' && defaultServer) {
				portalLayer.inlineLegendUrl = defaultServer + portalLayer.inlineLegendUrl;
			}
		}

		bus.send('add-layer', portalLayer);
		bus.send('layer-visibility', [ portalLayer.id, portalLayer.active || false ]);
	}

	function processGroup(parentId, group) {
		group.parentId = parentId;
		bus.send('add-group', group);
		group.items.forEach(function(item) {
			if (typeof item === 'object') {
				processGroup(group.id, item);
			} else {
				processPortalLayer(group.id, item);
			}
		});
	}

	function reload() {
		bus.send('reset-layers');

		defaultServer = null;
		if (layerRoot['default-server']) {
			defaultServer = layerRoot['default-server'];
			defaultServer = $.trim(defaultServer);
			if (defaultServer.substring(0, 7) != 'http://') {
				defaultServer = 'http://' + defaultServer;
			}
		}

		bus.send('before-adding-layers');
		layerRoot.groups.forEach(function(group) {
			processGroup(null, group);
		});

		// A copy of the original so it is not modified by listeners
		bus.send('layers-loaded', [ JSON.parse(JSON.stringify(original)) ]);
	}

	function setRoot(root) {
		original = root;

		// A copy of the original to add extra properties for add-layer,
		// add-group events
		layerRoot = JSON.parse(JSON.stringify(original));
		reload();
	}

	bus.listen('modules-loaded', function() {
		setRoot(module.config());
	});

	bus.listen('layers-set-root', function(e, root) {
		setRoot(root);
	});
});
