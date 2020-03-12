define([ './controlRegistry' ], function(controlRegistry) {
	controlRegistry.registerControl('navigation', function(message) {
		return new OpenLayers.Control.Navigation();
	});
});
