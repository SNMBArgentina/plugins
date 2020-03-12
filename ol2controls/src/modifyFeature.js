define([ 'ol2/controlRegistry', 'ol2/map' ], function(controlRegistry, map) {
	controlRegistry.registerControl('modifyFeature', function(message) {
		var layer = map.getMap().getLayer(message.editingLayerId);
		var modifyControl = new OpenLayers.Control.ModifyFeature(layer);
		return modifyControl;
	});
});
