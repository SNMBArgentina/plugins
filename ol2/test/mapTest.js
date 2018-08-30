define([ 'geoladris-tests' ], function(tests) {
	describe('map', function() {
		var bus;
		var injector;
		var map;
		var parentId = 'parent';

		function test(config, check) {
			tests.replaceParent(parentId);
			config.htmlId = parentId;

			var initialization = tests.init({
				'map': config
			}, {
				// paths are relative to 'modules'
				'openlayers': '../jslib/openlayers'
			});
			bus = initialization.bus;
			injector = initialization.injector;

			injector.mock('layout', {
				map: {
					attr: function() {
						return 'map';
					}
				}
			});

			injector.require([ 'map' ], function(m) {
				bus.send('modules-initialized');
				map = m.getMap();
				check();
			});
		}

		it('sets map center on zoom-to with object', function(done) {
			test({}, function() {
				map.addLayer(new OpenLayers.Layer.WMS('osm', 'http://ows.terrestris.de/osm/service', {
					layers: 'OSM-WMS',
					isBaseLayer: true,
					transparent: true,
					format: 'image/png'
				}));

				bus.send('zoom-to', {
					x: 12,
					y: 48,
					zoomLevel: 8
				});

				// if no crs provided, zoomTo coordinates are always in 4326;
				// map.projection may not
				var center = map.center.clone();
				center.transform(map.projection, 'EPSG:4326');

				expect(Math.abs(center.lon - 12)).toBeLessThan(1e-10);
				expect(Math.abs(center.lat - 48)).toBeLessThan(1e-10);
				expect(map.zoom).toEqual(8);
				done();
			});
		});

		it('maintains zoom level on zoom-to if not specified', function(done) {
			test({}, function() {
				map.addLayer(new OpenLayers.Layer.WMS('osm', 'http://ows.terrestris.de/osm/service', {
					layers: 'OSM-WMS',
					isBaseLayer: true,
					transparent: true,
					format: 'image/png'
				}));

				map.setCenter(null, 10);

				expect(map.getZoom()).toEqual(10);
				bus.send('zoom-to', {
					x: 12,
					y: 48
				});
				expect(map.getZoom()).toEqual(10);
				done();
			});
		});

		it('sets zoom level starting from nearest if zoomLevel is negative on zoom-to', function(done) {
			test({}, function() {
				map.addLayer(new OpenLayers.Layer.WMS('osm', 'http://ows.terrestris.de/osm/service', {
					layers: 'OSM-WMS',
					isBaseLayer: true,
					transparent: true,
					format: 'image/png'
				}));

				bus.send('zoom-to', {
					x: 12,
					y: 48,
					zoomLevel: -4
				});

				expect(map.getZoom()).toEqual(map.getNumZoomLevels() - 4);
				done();
			});
		});

		it('addFeature raises featureAdded event', function(done) {
			test({}, function() {
				bus.send('map:addLayer', {
					'layerId': 'mylayer',
					'vector': {}
				});
				var feature = {
					'type': 'Feature',
					'geometry': null,
					'properties': {
						'id': 1
					}
				};
				bus.send('map:addFeature', {
					'layerId': 'mylayer',
					'feature': feature
				});

				var featureAddedCalls = bus.send.calls.allArgs().filter(function(args) {
					return args[0] == 'map:featureAdded';
				});
				expect(featureAddedCalls.length).toBe(1);
				var featureAddedArgs = featureAddedCalls[0];
				var featureAddedMessage = featureAddedArgs[1];
				expect(featureAddedMessage.feature.geometry).toBe(null);
				expect(featureAddedMessage.feature.properties).toEqual({
					'id': 1
				});
				done();
			});
		});

		it('add feature with ol2 API raises featureAdded event', function(done) {
			test({}, function() {
				bus.send('map:addLayer', {
					'layerId': 'mylayer',
					'vector': {}
				});

				map.getLayer('mylayer').addFeatures([ new OpenLayers.Feature.Vector(null, {
					'foo': 'bar'
				}) ]);

				var featureAddedArgs = bus.send.calls.allArgs().filter(function(args) {
					return args[0] == 'map:featureAdded';
				})[0];
				var featureAddedMessage = featureAddedArgs[1];
				expect(featureAddedMessage.feature.geometry).toBe(null);
				expect(featureAddedMessage.feature.id).not.toBeNull();
				done();
			});
		});

		it('modify feature with ol2 API raises featureModified event', function(done) {
			test({}, function() {
				bus.send('map:addLayer', {
					'layerId': 'mylayer',
					'vector': {}
				});

				var feature = new OpenLayers.Feature.Vector(null, {
					'foo': 'bar'
				});
				map.getLayer('mylayer').addFeatures([ feature ]);
				map.getLayer('mylayer').events.triggerEvent('featuremodified', {
					'feature': feature
				});

				var featureModifiedArgs = bus.send.calls.allArgs().filter(function(args) {
					return args[0] == 'map:featureModified';
				})[0];
				var featureModifiedMessage = featureModifiedArgs[1];
				expect(featureModifiedMessage.feature.geometry).toBe(null);
				expect(featureModifiedMessage.feature.id).not.toBeNull();
				done();
			});
		});

		it('sets 20 zoom levels by default', function(done) {
			test({}, function() {
				expect(map.numZoomLevels).toBe(20);
				done();
			});
		});

		it('sets numZoomLevels from configuration', function(done) {
			test({
				numZoomLevels: 14
			}, function() {
				expect(map.numZoomLevels).toBe(14);
				done();
			});
		});
	});
});
