define([ 'geoladris-tests' ], function(tests) {
	describe('time-slider', function() {
		var bus;
		var injector;
		var parentId = 'toolbar';

		beforeEach(function(done) {
			var initialization = tests.init();
			injector = initialization.injector;
			bus = initialization.bus;

			tests.replaceParent(parentId);
			var parent = document.getElementById(parentId);

			injector.mock('ui/ui', {
				create: function(props) {
					var elem = document.createElement(props.type);
					elem.id = props.id;
					elem.className = props.css || '';
					parent.appendChild(elem);
					elem.innerHTML = props.html;
					return elem;
				}
			});

			injector.require([ 'time-slider' ], function() {
				bus.send('modules-initialized');
				done();
			});
		});

		it('sends time-slider.selection on layers-loaded', function() {
			bus.send('add-layer', {
				timestamps: [ '2017-01-01T00:00:00Z' ]
			});
			bus.send('layers-loaded');

			expect(bus.send).toHaveBeenCalledWith('time-slider.selection', new Date(Date.UTC(2017, 0)));
		});
	});
});
