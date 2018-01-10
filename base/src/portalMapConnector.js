define([ 'message-bus', 'iso8601', 'geojson/geojson' ], function(bus, iso8601, geojson) {
	/* highlight layer */
	var highlightLayerId = 'Highlighted Features';

	/* Exclusive control management */
	var currentControlIds = [];
	var defaultExclusiveControl = [];

	/*
	 * Stores the indices during the layer load in order to set the right order
	 * when all add-layer events are issued at start up
	 */
	var zIndexes = {};

	/*
	 * keep the information about wms layers that will be necessary for
	 * visibility, opacity, etc.
	 */
	var mapLayersByLayerId = {};

	var queriableLayers = {};

	var activateExclusiveControl = function(controlIds) {
		for (var i = 0; i < currentControlIds.length; i++) {
			bus.send('map:deactivateControl', {
				'controlId': currentControlIds[i]
			});
		}

		for (var i = 0; i < controlIds.length; i++) {
			bus.send('map:activateControl', {
				'controlId': controlIds[i]
			});
		}

		currentControlIds = controlIds.slice(0);
	};

	bus.listen('activate-default-exclusive-control', function(event) {
		activateExclusiveControl(defaultExclusiveControl);
	});

	bus.listen('activate-exclusive-control', function(event, message) {
		activateExclusiveControl(message.controlIds);
	});

	bus.listen('modules-loaded', function(e, message) {
		bus.send('map:createControl', {
			'controlId': 'navigation',
			'controlType': 'navigation'
		});
		bus.send('map:activateControl', {
			'controlId': 'navigation'
		});
		bus.send('map:createControl', {
			'controlId': 'scale',
			'controlType': 'scale'
		});
		bus.send('map:activateControl', {
			'controlId': 'scale'
		});
	});

	function deriveControlId(layerId) {
		return 'infocontrol-' + layerId;
	}

	var tempMapLayerQueryInfo = {};

	bus.listen('add-layer', function(e, layerInfo) {
		var mapLayerArray = [];
		for (var index = 0; index < layerInfo.mapLayers.length; index++) {
			var mapLayer = layerInfo.mapLayers[index];
			var mapAddLayerEvent = {
				'layerId': mapLayer.id
			};
			if (mapLayer.type == 'osm') {
				mapAddLayerEvent.osm = {
					'osmUrls': mapLayer.osmUrls
				};
			} else if (mapLayer.type == 'gmaps') {
				mapAddLayerEvent.gmaps = {
					'gmaps-type': mapLayer['gmaps-type']
				};
			} else if (mapLayer.type == 'wfs') {
				mapAddLayerEvent.wfs = {
					'baseUrl': mapLayer.baseUrl,
					'wmsName': mapLayer.wmsName
				};
			} else {
				wmsInfo = {
					'baseUrl': mapLayer.baseUrl,
					'wmsName': mapLayer.wmsName
				};
				if (mapLayer.imageFormat) {
					wmsInfo.imageFormat = mapLayer.imageFormat;
				}
				mapAddLayerEvent.wms = wmsInfo;
			}

			/*
			 * We prepare the event to install the info control associated with
			 * the layer. We listen map:layerAdded in order to install the
			 * control
			 */
			var queryInfo = null;
			if (mapLayer.queryType == 'wfs') {
				queryInfo = {
					'controlId': deriveControlId(mapLayer.id),
					'controlType': 'wfsinfo',
					'layerId': mapLayer.id,
					'url': mapLayer.queryUrl,
					'wfsName': mapLayer.wmsName,
					'fieldNames': mapLayer.queryFieldNames,
					'geomFieldName': mapLayer.queryGeomFieldName,
					'timeFieldName': mapLayer.queryTimeFieldName
				};
			} else if (mapLayer.queryType == 'wms') {
				queryInfo = {
					'controlId': deriveControlId(mapLayer.id),
					'controlType': 'wmsinfo',
					'layerId': mapLayer.id,
					'queryUrl': mapLayer.queryUrl,
					'layerUrl': mapLayer.baseUrl,
					'highlightBounds': mapLayer.queryHighlightBounds
				};
			}
			if (queryInfo != null) {
				tempMapLayerQueryInfo[mapLayer.id] = queryInfo;
				queriableLayers[mapLayer.id] = true;
			}

			zIndexes[mapLayer.zIndex] = mapLayer.id;
			bus.send('map:addLayer', mapAddLayerEvent);
			mapLayerArray.push(mapLayer.id);
		}
		if (mapLayerArray.length > 0) {
			mapLayersByLayerId[layerInfo.id] = mapLayerArray;
		}
	});

	bus.listen('map:layerAdded', function(e, message) {
		/*
		 * Install the info control if we have queryInfo for it, built in
		 * add-layer listener
		 */
		var queryInfo = tempMapLayerQueryInfo[message.layerId];
		if (queryInfo) {
			bus.send('map:createControl', queryInfo);
			// We do not activate the control since we'll do it in response to a
			// layer-visibility event

			// We just need the information between add-layer and map:layerAdded
			// events
			delete tempMapLayerQueryInfo[message.layerId];
		}
	});

	bus.listen('layers-loaded', function(e) {
		// Add the layers in the right zindex order
		var sortedZIndices = Object.keys(zIndexes).sort(function(a, b) {
			return a - b;
		});

		for (var i = 0; i < sortedZIndices.length; i++) {
			var zIndex = sortedZIndices[i];
			var mapLayerId = zIndexes[zIndex];
			bus.send('map:setLayerIndex', {
				'layerId': mapLayerId,
				'index': i
			});
		}

		// Create highlight layer
		bus.send('map:addLayer', {
			'layerId': highlightLayerId,
			'vector': {
				'style': {
					'strokeWidth': 5,
					fillOpacity: 0,
					strokeColor: '#ee4400',
					strokeOpacity: 0.5,
					strokeLinecap: 'round'
				}
			}
		});

		activateExclusiveControl(defaultExclusiveControl);
	});

	bus.listen('reset-layers', function() {
		for ( var layerId in mapLayersByLayerId) {
			var mapLayerIds = mapLayersByLayerId[layerId];
			for (var i = 0; i < mapLayerIds.length; i++) {
				mapLayerId = mapLayerIds[i];
				if (queriableLayers.hasOwnProperty(mapLayerId)) {
					bus.send('map:destroyControl', {
						'controlId': deriveControlId(mapLayerId)
					});
				}
			}
		}
		defaultExclusiveControl = [];
		currentControlIds = [];

		queriableLayers = {};
		mapLayersByLayerId = {};
		zIndexes = {};
		bus.send('map:removeAllLayers');
	});

	bus.listen('layer-visibility', function(event, layerId, visibility) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				// disable layer at the map level
				var mapLayerId = mapLayers[index];
				bus.send('map:layerVisibility', {
					'layerId': mapLayerId,
					'visibility': visibility
				});

				if (queriableLayers.hasOwnProperty(mapLayerId)) {
					// Update default exclusive control removing or adding the
					// info control
					if (visibility) {
						defaultExclusiveControl.push(deriveControlId(mapLayerId));
					} else {
						var index = null;
						for (var i = 0; i < defaultExclusiveControl.length; i++) {
							if (defaultExclusiveControl[i] == deriveControlId(mapLayerId)) {
								index = i;
								break;
							}
						}
						if (index != null) {
							defaultExclusiveControl.splice(index, 1);
						}
					}
					activateExclusiveControl(defaultExclusiveControl);
				}
			}
		}
	});

	bus.listen('layer-timestamp-selected', function(e, layerId, timestamp, style) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				var mapLayerId = mapLayers[index];
				if (queriableLayers.hasOwnProperty(mapLayerId)) {
					bus.send('map:updateControl', {
						'controlId': deriveControlId(mapLayerId),
						'timestamp': timestamp
					});
				}

				var configuration = {
					'time': iso8601.toString(timestamp)
				};
				if (style != null) {
					configuration.styles = style;
				}

				bus.send('map:mergeLayerParameters', {
					'layerId': mapLayerId,
					'parameters': configuration
				});
			}
		}
	});

	bus.listen('transparency-slider-changed', function(e, layerId, opacity) {
		var mapLayers = mapLayersByLayerId[layerId];
		if (mapLayers) {
			for (var index = 0; index < mapLayers.length; index++) {
				var mapLayerId = mapLayers[index];
				bus.send('map:setLayerOpacity', {
					'layerId': mapLayerId,
					'opacity': opacity
				});
			}
		}
	});

	bus.listen('highlight-feature', function(event, geometry) {
		bus.send('map:removeAllFeatures', {
			layerId: highlightLayerId
		});
		var feature = geojson.createFeature(geometry, {});
		bus.send('map:addFeature', {
			'layerId': highlightLayerId,
			'feature': feature
		});
	});

	bus.listen('clear-highlighted-features', function() {
		bus.send('map:removeAllFeatures', {
			layerId: highlightLayerId
		});
	});
});
