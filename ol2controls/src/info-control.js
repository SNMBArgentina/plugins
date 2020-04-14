define([ 'ol2/map', 'message-bus', 'customization', 'ol2/controlRegistry', 'geojson/geojson', 'openlayers', 'jquery' ], function(map, bus,
		customization, controlRegistry, geojson) {
	var addBBoxAndHighlightGeom = function(feature) {
		var bbox = null;
		var highlightGeom = null;

		if (feature.hasOwnProperty('geometry') && feature.geometry != null) {
			var olGeometry = new OpenLayers.Format.GeoJSON().read(feature.geometry, 'Geometry');
			bbox = olGeometry.getBounds().toArray();
			highlightGeom = feature.geometry;
		} else if (feature.properties.hasOwnProperty('bbox')) {
			bbox = feature.properties.bbox;
			highlightGeom = geojson.createPolygonFromBBox(bbox);
		}

		feature.bbox = bbox;
		feature.highlightGeom = highlightGeom;
	};

	function sendInfoFeatures(layerId, features, x, y) {
		var mapPoint = map.getMap().getLonLatFromPixel({
			'x': x,
			'y': y
		});
		bus.send('info-features', [ layerId, features, x, y, {
			'x': mapPoint.lon,
			'y': mapPoint.lat
		} ]);
	}

	controlRegistry.registerControl('wfsinfo', function(queryInfo) {
		var queryUrl = queryInfo.url;
		queryUrl = queryUrl.trim();
		queryUrl = queryUrl.replace(/wms$/, 'wfs');
		queryUrl = queryUrl + '?request=GetFeature&service=wfs&' + //
		'version=1.0.0&outputFormat=application/json&srsName=EPSG:900913&' + //
		'typeName=' + queryInfo.wfsName + '&propertyName=' + queryInfo.fieldNames.join(',');

		var wfsCallControl = null;

		control = new OpenLayers.Control();
		control.handler = new OpenLayers.Handler.Click(control, {
			'click': function(e) {
				// bbox parameter
				var tolerance = 5;
				var point1 = map.getMap().getLonLatFromPixel(e.xy.offset({
					x: -tolerance,
					y: -tolerance
				}));
				var point2 = map.getMap().getLonLatFromPixel(e.xy.offset({
					x: tolerance,
					y: tolerance
				}));
				var bboxFilter = //
				'  <ogc:Intersects>' + //
				'    <ogc:PropertyName>' + queryInfo.geomFieldName + '</ogc:PropertyName>' + //
				'    <gml:Box xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:900913">' + //
				'      <gml:coordinates decimal="." cs="," ts=" ">' + (point1.lon) + ',' + (point1.lat) + ' ' + (point2.lon) + ',' + (point2.lat)
						+ '</gml:coordinates>' + //
						'    </gml:Box>' + //
						'  </ogc:Intersects>'; //

				// time parameter
				var getFeatureMessage = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">';
				if (queryInfo.hasOwnProperty('timestamp')) {
					getFeatureMessage += //
					'  <ogc:And>' + //
					'' + bboxFilter + //
					'    <ogc:PropertyIsEqualTo>' + //
					'      <ogc:PropertyName>' + queryInfo.timeFieldName + '</ogc:PropertyName>' + //
					'      <ogc:Function name="dateParse">' + //
					'        <ogc:Literal>yyyy-MM-dd</ogc:Literal>' + //
					'        <ogc:Literal>' + queryInfo.timestamp.toISO8601String() + '</ogc:Literal>' + //
					'      </ogc:Function>' + //
					'    </ogc:PropertyIsEqualTo>' + //
					'  </ogc:And>';
				} else {
					getFeatureMessage += bboxFilter;
				}
				getFeatureMessage += '</ogc:Filter>';
				var url = queryUrl + '&FILTER=' + encodeURIComponent(getFeatureMessage);

				if (wfsCallControl != null) {
					wfsCallControl.abort();
				}
				bus.send('clear-info-features');

				bus.send('ajax', {
					dataType: 'json',
					url: 'proxy',
					data: $.param({
						url: url
					}),
					success: function(geojsonFeatureCollection, textStatus, jqXHR) {
						var features = geojsonFeatureCollection.features;
						for (var index = 0; index < features.length; index++) {
							var feature = features[index];
							addBBoxAndHighlightGeom(feature);
						}
						sendInfoFeatures(queryInfo.layerId, features, e.xy.x, e.xy.y);
					},
					controlCallBack: function(control) {
						wfsCallControl = control;
					},
					errorMsg: 'Cannot get info for layer ' + queryInfo.label
				});
			}
		});

		return control;
	});

	controlRegistry.registerControl('wmsinfo', function(queryInfo) {
		var lastXY = null;

		var url = queryInfo.layerUrl;
		if (url instanceof Array) {
			url = url[0];
		}

		var control = new OpenLayers.Control.WMSGetFeatureInfo({
			url: queryInfo.queryUrl,
			layerUrls: [ url ],
			title: 'Identify features by clicking',
			infoFormat: 'application/vnd.ogc.gml',
			drillDown: false,
			queryVisible: true,
			maxFeatures: 5,
			handlerOptions: {
				'click': {
					'single': true,
					'double': false
				}
			},
			eventListeners: {
				getfeatureinfo: function(evt) {
					if (evt.features && evt.features.length > 0 && lastXY.x == evt.xy.x && lastXY.y == evt.xy.y) {
						var features = evt.features;

						// re-project to Google projection
						epsg4326 = new OpenLayers.Projection('EPSG:4326');
						epsg900913 = new OpenLayers.Projection('EPSG:900913');
						var geojsonFeatures = [];
						$.each(evt.features, function(index, feature) {
							if (feature.geometry) {
								if (queryInfo.queryHighlightBounds) {
									feature.geometry = feature.geometry.getBounds().toGeometry();
								}
								feature.geometry.transform(epsg4326, epsg900913);
							}
							var geojsonFeature = JSON.parse(new OpenLayers.Format.GeoJSON().write(feature));
							addBBoxAndHighlightGeom(geojsonFeature);
							geojsonFeatures.push(geojsonFeature);
						});

						sendInfoFeatures(queryInfo.layerId, geojsonFeatures, evt.xy.x, evt.xy.y);
					}
				},
				beforegetfeatureinfo: function(event) {
					lastXY = event.xy;
					var id = queryInfo.layerId;
					if (queryInfo.hasOwnProperty('timestamp')) {
						control.vendorParams = {
							'time': queryInfo.timestamp.toISO8601String()
						};
					}

					bus.send('clear-info-features');
				}
			},
			formatOptions: {
				typeName: 'XXX',
				featureNS: 'http://www.openplans.org/unredd'
			}
		});

		var layer = map.getMap().getLayer(queryInfo.layerId);
		control.layers = new Array();
		control.layers.push(layer);

		return control;
	});
});
