define([ './controlRegistry' ], function(controlRegistry) {
	controlRegistry.registerControl('scale', function(message) {
		return new OpenLayers.Control.Scale();
	});
});
