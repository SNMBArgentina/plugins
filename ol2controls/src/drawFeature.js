define([ 'ol2/controlRegistry', 'ol2/map' ], function(controlRegistry, map) {
	controlRegistry.registerControl('drawFeature', function(message) {
		var handler = message.handlerType;
		var layer = map.getMap().getLayer(message.editingLayerId);
		var drawControl = null;
		if (message.handlerType == 'point') {
			drawControl = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Point);
		} else if (message.handlerType == 'line') {
			drawControl = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Path);
		} else if (message.handlerType == 'polygon') {
			drawControl = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Polygon);
		}
		return drawControl;
	});
});
