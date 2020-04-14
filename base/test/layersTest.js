define([ 'geoladris-tests' ], function(tests) {
	describe('layers', function() {
		var bus;
		var injector;

		beforeEach(function() {
			var initialization = tests.init({
				'layers': {
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
				}
			});
			injector = initialization.injector;
			bus = initialization.bus;

			injector.mock('customization', {
				languageCode: 'fr'
			});
		});

		it('layers init', function(done) {
			injector.require([ 'layers' ], function() {
				expect(bus.listen).toHaveBeenCalled();
				done();
			});
		});

		it('layers process', function(done) {
			injector.require([ 'layers' ], function() {
				bus.listen('layers-loaded', function() {
					done();
				});
				bus.send('modules-loaded');
			});
		});
	});
});
