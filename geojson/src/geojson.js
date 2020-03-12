define([ 'wellknown' ], function(wellknown) {
	function createPolygon(externalRing, internalRings) {
		if (!internalRings) {
			internalRings = [];
		}
		var allRings = [ externalRing ].concat(internalRings);
		for (var i = 0; i < allRings.length; i++) {
			allRings[i] = toCoordinateList(allRings[i]);
		}
		return {
			'type': 'Polygon',
			'coordinates': allRings
		};
	}

	function toCoordinateList(ordinateList) {
		var coordinates = [];
		for (var i = 0; i < ordinateList.length; i += 2) {
			coordinates.push([ ordinateList[i], ordinateList[i + 1] ]);
		}
		return coordinates;
	}

	return {
		'createFeature': function(geometry, properties) {
			return {
				'type': 'Feature',
				'geometry': geometry,
				'properties': properties
			};
		},
		'createPoint': function(x, y) {
			return {
				'type': 'Point',
				'coordinates': [ x, y ]
			};
		},
		'createLineString': function() {
			return {
				'type': 'LineString',
				'coordinates': toCoordinateList(arguments)
			};
		},
		'createPolygon': createPolygon,
		'createMultiPolygon': function(polygons) {
			polygonCoordinates = polygons.map(function(polygon) {
				return polygon.coordinates;
			});
			return {
				'type': 'MultiPolygon',
				'coordinates': polygonCoordinates
			};
		},
		'createPolygonFromBBox': function(bbox) {
			var x1 = bbox[0];
			var y1 = bbox[1];
			var x2 = bbox[2];
			var y2 = bbox[3];
			return createPolygon([ x1, y1, x2, y1, x2, y2, x1, y2, x1, y1 ]);
		},
		'toWKT': function(geojson) {
			return wellknown.stringify(geojson);
		},
		'fromWKT': function(wkt) {
			return wellknown.parse(wkt);
		}
	};
});
