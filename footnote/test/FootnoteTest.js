define([ 'geoladris-tests' ], function(tests) {
	describe('Footnote tests', function() {
		var bus;
		var injector;
		var ui;

		function initialize(configuration) {
			var initialization = tests.init(configuration, {});
			injector = initialization.injector;
			bus = initialization.bus;
			ui = {
				'create': function() {
					return document.createElement('a');
				}
			};
			spyOn(ui, 'create').and.callThrough();

			injector.mock('i18n', {});
			injector.mock('ui/ui', ui);
		}

		it('only text and link', function(done) {
			initialize({
				'footnote': {
					'text': 'abc',
					'link': 'http://abc.com'
				}
			});
			injector.require([ 'footnote' ], function() {
				bus.send('modules-initialized');
				expect(ui.create).toHaveBeenCalledWith('a', jasmine.objectContaining({
					'html': 'abc'
				}));
				done();
			});
		});

		it('notes array', function(done) {
			initialize({
				'footnote': {
					'notes': [ {
						'text': 'abc',
						'link': 'http://abc.com'
					}, {
						'text': 'xyz',
						'link': 'http://xyz.com'
					} ]
				}
			});
			injector.require([ 'footnote' ], function() {
				bus.send('modules-initialized');
				expect(ui.create).toHaveBeenCalledWith('a', jasmine.objectContaining({
					'html': 'abc'
				}));
				expect(ui.create).toHaveBeenCalledWith('a', jasmine.objectContaining({
					'html': 'xyz'
				}));
				done();
			});
		});

		it('html in conf', function(done) {
			initialize({
				'footnote': {
					'html': '<a href="http://xyz.com">xyz</a>'
				}
			});
			injector.require([ 'footnote' ], function() {
				bus.send('modules-initialized');
				expect(ui.create).toHaveBeenCalledWith('div', jasmine.objectContaining({
					'html': '<a href="http://xyz.com">xyz</a>'
				}));
				done();
			});
		});
	});
});
