define([ 'message-bus', 'jquery' ], function(bus, $) {
	bus.listen('modules-loaded', function() {
		bus.send('ui-loading:end', 'Cargando aplicación');
	});
	bus.send('ui-loading:start', 'Cargando aplicación');
});
