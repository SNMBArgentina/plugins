define([ 'geoladris-tests' ], function(tests) {
	describe('control registry suite', function() {
		var bus;
		var injector;

		var control = {
			'activate': function() {
			}
		};

		function controlCreator() {
			return control;
		}

		var map = {
			'addControl': function() {
			}
		};

		beforeEach(function() {
			var initialization = tests.init({}, {
				// paths are relative to 'modules'
				'openlayers': '../jslib/openlayers'
			});
			injector = initialization.injector;
			bus = initialization.bus;

			injector.mock('map', {
				getMap: function() {
					return map;
				}
			});

			spyOn(control, 'activate');
			spyOn(map, 'addControl');
		});

		it('Create control does not activate', function(done) {
			var fcn = function(controlRegistry) {
				controlRegistry.registerControl('mytype', controlCreator);
				bus.send('map:createControl', {
					'controlId': 'mycontrol',
					'controlType': 'mytype'
				});
				expect(map.addControl).toHaveBeenCalled();
				expect(control.activate).not.toHaveBeenCalled();
				done();
			};
			injector.require([ 'controlRegistry' ], fcn);
		});

		it('Activate control', function(done) {
			var fcn = function(controlRegistry) {
				controlRegistry.registerControl('mytype', controlCreator);
				bus.send('map:createControl', {
					'controlId': 'mycontrol',
					'controlType': 'mytype'
				});
				bus.send('map:activateControl', {
					'controlId': 'mycontrol'
				});
				expect(control.activate).toHaveBeenCalled();
				done();
			};
			injector.require([ 'controlRegistry' ], fcn);
		});
	});
});
