define([ 'geoladris-tests' ], function(tests) {
	describe('layers-api', function() {
		var injector;
		var bus;

		beforeEach(function() {
			var initialization = tests.init();
			injector = initialization.injector;
			bus = initialization.bus;

			injector.mock('customization', {
				languageCode: 'fr'
			});
		});

		it('remove layer in second level', function(done) {
			var root = {
				'default-server': 'http://demo1.geo-solutions.it',
				'wmsLayers': [ {
					'id': 'blue-marble',
					'baseUrl': 'http://rdc-snsf.org/diss_geoserver/wms',
					'wmsName': 'unredd:blue_marble',
					'imageFormat': 'image/jpeg'
				} ],
				'portalLayers': [ {
					'id': 'blue-marble',
					'label': 'Blue marble',
					'layers': [ 'blue-marble' ]
				} ],
				'groups': [ {
					'id': 'base',
					'label': 'Base',
					'items': [ {
						'id': 'innerbase',
						'label': 'General purpose',
						'items': [ 'blue-marble' ]
					} ]
				} ]
			};

			injector.require([ 'layers-api' ], function(api) {
				bus.send('layers-loaded', root);
				var layer = api.getPortalLayer('blue-marble');
				if (layer != null) { // to ignore reentering calls
					api.removePortalLayer(layer.id);
					var group = api.getGroup('innerbase');
					expect(group.items.length).toBe(0);
					done();
				}
			});
		});
	});
});
