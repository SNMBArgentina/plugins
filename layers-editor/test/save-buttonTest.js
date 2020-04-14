define([ 'geoladris-tests' ], function(tests) {
	describe('save-button', function() {
		var api = {
			get: function() {
				return {};
			}
		};
		var toolbar;
		var i18n = {
			'layers-editor.save_layers': 'Save my layers!',
			'layers-editor.error_saving': 'Could not save them!'
		};
		var injector;
		var bus;
		var ui;

		beforeEach(function() {
			var initialization = tests.init();
			injector = initialization.injector;
			bus = initialization.bus;

			ui = jasmine.createSpyObj('ui', [ 'create' ]);

			toolbar = $('<div/>').attr('id', 'toolbar');
			$('body').append(toolbar);
			injector.mock('toolbar', toolbar);
			injector.mock('ui/ui', ui);
			injector.mock('./layers-api', api);
			injector.mock('i18n', i18n);
		});

		afterEach(function() {
			$('#toolbar').remove();
		});

		it('creates a button', function(done) {
			injector.require([ 'save-button' ], function(saveButton) {
				expect(ui.create).toHaveBeenCalledWith('button', jasmine.objectContaining({
					id: 'save-layers-button',
					parent: 'toolbar',
					css: 'blue_button toolbar_button',
					html: i18n['layers-editor.save_layers']
				}));
				done();
			});
		});
	});
});
