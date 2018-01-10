define([ 'message-bus', 'module', './geojson', 'openlayers' ], function(bus, module, geojson) {
	var config = module.config();

	var map = null;

	OpenLayers.ProxyHost = 'proxy?url=';

	function addGoogleLayer(message) {
		if (!google.maps) {
			console.error('Google Maps has not been loaded');
			return;
		}

		var layer = new OpenLayers.Layer.Google(message.layerId, {
			type: google.maps.MapTypeId[message.gmaps['gmaps-type']]
		});
		layer.id = message.layerId;
		getMap().addLayer(layer);
		bus.send('map:layerAdded', [ message ]);
		layer.setVisibility(message.visibility);
		if (message.index !== undefined) {
			getMap().setLayerIndex(layer, message.index);
		}
	}

	var googleLayers = {};
	if (config.gmaps_key) {
		require([ 'async!http://maps.google.com/maps/api/js?key=' + config.gmaps_key ], function() {
			if (googleLayers !== null) {
				for ( var id in googleLayers) {
					addGoogleLayer(googleLayers[id]);
				}
				googleLayers = null;
			}
		});
	}

	bus.listen('modules-initialized', function(e, message) {
		var htmlId = null;
		if (config.hasOwnProperty('htmlId')) {
			htmlId = config.htmlId;
		} else {
			// backwards compatibility
			htmlId = 'map';
		}

		map = new OpenLayers.Map(htmlId, {
			fallThrough: true,
			theme: null,
			projection: new OpenLayers.Projection('EPSG:900913'),
			displayProjection: new OpenLayers.Projection('EPSG:4326'),
			units: 'm',
			allOverlays: true,
			controls: [],
			numZoomLevels: config.numZoomLevels || 20
		});
	});

	bus.listen('map:layerVisibility', function(event, message) {
		if (googleLayers && googleLayers[message.layerId]) {
			googleLayers[message.layerId].visibility = message.visibility;
			return;
		}

		var layer = getMap().getLayer(message.layerId);
		layer.setVisibility(message.visibility);
	});

	bus.listen('zoom-in', function(event) {
		getMap().zoomIn();
	});

	bus.listen('zoom-out', function(event) {
		getMap().zoomOut();
	});

	function getCRSOr4326(obj) {
		var crsName = obj.hasOwnProperty('crs') ? obj.crs : 'EPSG:4326';
		return new OpenLayers.Projection(crsName);
	}

	bus.listen('zoom-to', function(event, msg) {
		if (msg instanceof OpenLayers.Bounds) {
			getMap().zoomToExtent(msg);
		} else if (msg instanceof Array) {
			getMap().zoomToExtent(msg);
		} else if (msg instanceof Object) {
			var center = new OpenLayers.LonLat(msg.x, msg.y);
			center.transform(getCRSOr4326(msg), getMap().projection);

			var zoomLevel = msg.zoomLevel;
			if (zoomLevel && zoomLevel < 0) {
				zoomLevel = Math.max(1, getMap().getNumZoomLevels() + zoomLevel);
			}
			getMap().setCenter(center, zoomLevel);
		}
	});

	bus.listen('map:setLayerOpacity', function(event, message) {
		var layer = getMap().getLayer(message.layerId);
		layer.setOpacity(message.opacity);
	});

	/*
	 * To simulate clicks. Used at least in the tour
	 */
	bus.listen('map-click', function(event, lat, lon) {
		var mapPoint = new OpenLayers.LonLat(lon, lat);
		mapPoint.transform(new OpenLayers.Projection('EPSG:4326'), getMap().projection);
		getMap().events.triggerEvent('click', {
			xy: getMap().getPixelFromLonLat(mapPoint)
		});
	});

	bus.listen('map:removeLayer', function(e, message) {
		var layer = getMap().getLayer(message.layerId);
		layer.removeAllFeatures();
		getMap().removeLayer(layer);
	});

	bus.listen('map:removeAllLayers', function(e) {
		if (getMap() !== null) {
			while (getMap().layers.length > 0) {
				getMap().removeLayer(getMap().layers[getMap().layers.length - 1]);
			}
		}
	});

	bus.listen('map:addLayer', function(e, message) {
		var layer = null;
		if (message.vector) {
			var vectorLayer = message.vector;
			var styles = new OpenLayers.StyleMap(vectorLayer.style);

			var layer = new OpenLayers.Layer.Vector(message.layerId, {
				styleMap: styles
			});
			layer.events.register('featureadded', ' ', function(event) {
				sendFeatureAdded(message.layerId, event.feature);
			});
			layer.events.register('featuremodified', ' ', function(event) {
				sendFeatureModified(message.layerId, event.feature);
			});
		} else if (message.osm) {
			layer = new OpenLayers.Layer.OSM(message.layerId, message.osm.osmUrls);
		} else if (message.gmaps) {
			if (googleLayers !== null) {
				// Google Maps API js has not been loaded yet
				googleLayers[message.layerId] = message;
			} else {
				// Google Maps API js already loaded; add layer
				addGoogleLayer(message);
			}
		} else if (message.wfs) {
			layer = new OpenLayers.Layer.Vector('WFS', {
				strategies: [ new OpenLayers.Strategy.Fixed() ],
				protocol: new OpenLayers.Protocol.WFS({
					version: '1.0.0',
					url: message.wfs.baseUrl,
					featureType: message.wfs.wmsName
				}),
				projection: new OpenLayers.Projection('EPSG:4326')
			});
		} else if (message.wms) {
			layer = new OpenLayers.Layer.WMS(message.layerId, message.wms.baseUrl, {
				layers: message.wms.wmsName,
				buffer: 0,
				transitionEffect: 'resize',
				removeBackBufferDelay: 0,
				isBaseLayer: false,
				transparent: true,
				format: message.wms.imageFormat || 'image/png'
			}, {
				noMagic: true
			});
		}
		if (layer != null) {
			layer.id = message.layerId;
			getMap().addLayer(layer);
			bus.send('map:layerAdded', [ message ]);
		}
	});

	bus.listen('map:mergeLayerParameters', function(e, message) {
		var layer = getMap().getLayer(message.layerId);
		layer.mergeNewParams(message.parameters);
	});

	bus.listen('map:setLayerIndex', function(e, message) {
		if (googleLayers && googleLayers[message.layerId]) {
			googleLayers[message.layerId].index = message.index;
			return;
		}

		var layer = getMap().getLayer(message.layerId);
		getMap().setLayerIndex(layer, message.index);
	});

	bus.listen('map:addFeature', function(e, message) {
		var layerId = message.layerId;
		var layer = getMap().getLayer(layerId);
		var feature = geojson.parse(message.feature);
		layer.addFeatures(feature);
		layer.redraw();
	});

	function sendFeatureAdded(layerId, olFeature) {
		bus.send('map:featureAdded', {
			'layerId': layerId,
			'feature': geojson.write(olFeature)
		});
	}

	function sendFeatureModified(layerId, olFeature) {
		bus.send('map:featureModified', {
			'layerId': layerId,
			'feature': geojson.write(olFeature)
		});
	}

	bus.listen('map:removeAllFeatures', function(e, message) {
		var layerId = message.layerId;
		var layer = getMap().getLayer(layerId);
		layer.removeAllFeatures();
		layer.redraw();
	});

	function getMap() {
		if (map == null) {
			throw 'Map is ready only in modules-loaded event';
		}
		return map;
	}

	return {
		'getMap': getMap
	};
});
