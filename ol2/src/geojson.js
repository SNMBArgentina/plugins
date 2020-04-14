define([ 'openlayers' ], function() {
	var GeoJSON = new OpenLayers.Format.GeoJSON();

	function parse(geojsonFeature) {
		return GeoJSON.read(geojsonFeature);
	}

	function write(olFeature) {
		var ret = JSON.parse(GeoJSON.write(olFeature));

		/*
		 * id attribute ignored by OL2 GeoJSON format
		 */
		if (olFeature.hasOwnProperty('id')) {
			ret.id = olFeature.id;
		}
		return ret;
	}

	return {
		'parse': parse,
		'write': write
	};
});
