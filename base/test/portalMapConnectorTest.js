define([ 'geoladris-tests' ], function(tests) {
	describe('portalMapConnector', function() {
		var bus;
		var injector;

		beforeEach(function(done) {
			var initialization = tests.init({}, {});
			injector = initialization.injector;
			bus = initialization.bus;

			injector.mock('iso8601', {
				'parse': function() {
				},
				'toString': function() {
				}
			});
			injector.mock('geojson/geojson', {
				'createFeature': function() {
					return {};
				}
			});
			injector.require([ 'portalMapConnector' ], function() {
				done();
			});
		});

		it('add-layer triggers map:addLayer immediately', function() {
			bus.send('add-layer', {
				'id': 'mylayer',
				'mapLayers': [ {
					'id': 'mymaplayer',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryUrl': 'http://query.url'
				} ]
			});
			expect(bus.send).toHaveBeenCalledWith('map:addLayer', {
				'layerId': 'mymaplayer',
				'wms': {
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer'
				}
			});
		});

		it('add-layer z-order defines map:setLayerIndex calls', function() {
			bus.send('add-layer', {
				'id': 'layer1',
				'mapLayers': [ {
					'id': 'maplayer1',
					'type': 'osm',
					'osmUrls': [ 'http://base.url' ],
					'zIndex': 2
				} ]
			});
			bus.send('add-layer', {
				'id': 'layer2',
				'mapLayers': [ {
					'id': 'maplayer2',
					'type': 'wfs',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'zIndex': 1
				} ]
			});
			var calls = bus.send.calls;
			calls.reset();
			bus.send('layers-loaded');
			expect(bus.send).toHaveBeenCalledWith('map:setLayerIndex', jasmine.objectContaining({
				'layerId': 'maplayer2',
				'index': 0
			}));
			expect(bus.send).toHaveBeenCalledWith('map:setLayerIndex', jasmine.objectContaining({
				'layerId': 'maplayer1',
				'index': 1
			}));
		});

		it('add-layer creates control if queryType present', function() {
			bus.send('add-layer', {
				'id': 'mylayer',
				'mapLayers': [ {
					'id': 'mymaplayer',
					'queryType': 'wms',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryUrl': 'http://query.url'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer'
			});
			expect(bus.send).toHaveBeenCalledWith('map:createControl', jasmine.objectContaining({
				'controlId': 'infocontrol-mymaplayer',
				'controlType': 'wmsinfo',
				'queryUrl': 'http://query.url',
				'layerUrl': 'http://base.url'
			}));
		});

		it('add-layer does not create control if queryType not present', function() {
			bus.send('add-layer', {
				'id': 'mylayer',
				'mapLayers': [ {
					'id': 'mymaplayer',
					'baseUrl': 'http://base.url',
					'queryUrl': 'http://query.url'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer'
			});
			expect(bus.send).not.toHaveBeenCalledWith('map:createControl');
		});

		it('layer-visibility activates/deactivates control', function() {
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'queryType': 'wms',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryUrl': 'http://query.url'
				}, {
					'id': 'mymaplayer2',
					'queryType': 'wms',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryUrl': 'http://query.url'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer2'
			});
			bus.send('add-layer', {
				'id': 'mylayer2',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer3',
					'queryType': 'wms',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryUrl': 'http://query.url'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer3'
			});

			expect(bus.send).not.toHaveBeenCalledWith('map:activateControl', jasmine.any(Object));
			expect(bus.send).not.toHaveBeenCalledWith('map:deactivateControl', jasmine.any(Object));
			bus.send('layer-visibility', [ 'mylayer1', true ]);
			bus.send('layer-visibility', [ 'mylayer2', false ]);
			bus.send.calls.reset();
			bus.send('activate-exclusive-control', {
				'controlIds': [ 'scale' ]
			});
			expect(bus.send).toHaveBeenCalledWith('map:activateControl', {
				'controlId': 'scale'
			});
			expect(bus.send).toHaveBeenCalledWith('map:deactivateControl', {
				'controlId': 'infocontrol-mymaplayer1'
			});
			expect(bus.send).toHaveBeenCalledWith('map:deactivateControl', {
				'controlId': 'infocontrol-mymaplayer2'
			});
			bus.send.calls.reset();
			bus.send('activate-default-exclusive-control');
			expect(bus.send).toHaveBeenCalledWith('map:deactivateControl', {
				'controlId': 'scale'
			});
			expect(bus.send).toHaveBeenCalledWith('map:activateControl', {
				'controlId': 'infocontrol-mymaplayer1'
			});
			expect(bus.send).toHaveBeenCalledWith('map:activateControl', {
				'controlId': 'infocontrol-mymaplayer2'
			});
		});

		it('layer-visibility activates/deactivates only queriable layer controls', function() {
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});

			expect(bus.send).not.toHaveBeenCalledWith('map:activateControl', jasmine.any(Object));
			bus.send('layer-visibility', [ 'mylayer1', true ]);
			expect(bus.send).not.toHaveBeenCalledWith('map:activateControl', jasmine.any(Object));
		});

		it('layer-timestamp-selected updates only queriable layer controls', function() {
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer'
				}, {
					'id': 'mymaplayer2',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer2',
					'queryType': 'wms'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer2'
			});

			expect(bus.send).not.toHaveBeenCalledWith('map:updateControl', jasmine.any(Object));
			bus.send('layer-timestamp-selected', [ 'mylayer1', new Date() ]);
			expect(bus.send).not.toHaveBeenCalledWith('map:updateControl', jasmine.objectContaining({
				'controlId': 'infocontrol-mymaplayer1'
			}));
			expect(bus.send).toHaveBeenCalledWith('map:updateControl', jasmine.objectContaining({
				'controlId': 'infocontrol-mymaplayer2'
			}));
		});

		it('Reset layers destroys all info-control instances', function() {
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});
			bus.send('add-layer', {
				'id': 'layer2',
				'mapLayers': [ {
					'id': 'mymaplayer2',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryType': 'wms'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer2'
			});

			bus.send('reset-layers');
			expect(bus.send).not.toHaveBeenCalledWith('map:destroyControl', jasmine.objectContaining({
				'controlId': 'infocontrol-mymaplayer1'
			}));
			expect(bus.send).toHaveBeenCalledWith('map:destroyControl', jasmine.objectContaining({
				'controlId': 'infocontrol-mymaplayer2'
			}));
		});

		it('Reset layers clears default exclusive control', function() {
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryType': 'wms'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});

			bus.send('reset-layers');
			bus.send('activate-default-exclusive-control');
			expect(bus.send).not.toHaveBeenCalledWith('map:deactivateControl');
			expect(bus.send).not.toHaveBeenCalledWith('map:activateControl');
		});

		it('activate-exclusive-control activates existing controls, does not create it', function() {
			// "a" control must have been created in a prior call to
			// map:createControl
			var controlInfo = {
				'controlIds': [ 'a' ]
			};
			bus.send('activate-exclusive-control', controlInfo);
			expect(bus.send).not.toHaveBeenCalledWith('map:createControl', controlInfo);
			expect(bus.send).toHaveBeenCalledWith('map:activateControl', {
				'controlId': 'a'
			});
		});

		it('highlight layer is created on layers-loaded', function() {
			bus.send('layers-loaded');
			expect(bus.send).toHaveBeenCalledWith('map:addLayer', jasmine.objectContaining({
				'layerId': 'Highlighted Features'
			}));
		});

		it('Removing queryType in layer takes effect after reset-layers', function() {
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer',
					'queryType': 'wms'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});
			bus.send('reset-layers');

			bus.send.calls.reset();
			bus.send('add-layer', {
				'id': 'mylayer1',
				'active': true,
				'mapLayers': [ {
					'id': 'mymaplayer1',
					'baseUrl': 'http://base.url',
					'wmsName': 'ws:layer'
				} ]
			});
			bus.send('map:layerAdded', {
				'layerId': 'mymaplayer1'
			});
			expect(bus.send).not.toHaveBeenCalledWith('map:createControl', jasmine.any(Object));

			bus.send('layer-visibility', [ 'mylayer1', false ]);
			expect(bus.send).not.toHaveBeenCalledWith('map:deactivateControl', jasmine.any(Object));
		});
	});
});
