define([ 'geoladris-tests' ], function(tests) {
	describe('geojson', function() {
		var injector;

		beforeEach(function() {
			var initialization = tests.init({}, {
				'wellknown': '../node_modules/wellknown/wellknown'
			});
			injector = initialization.injector;
		});

		it('toWKT', function(done) {
			injector.require([ 'geojson' ], function(geojson) {
				function testToWKTAndBack(geometry) {
					var wkt = geojson.toWKT(geometry);
					var convertedGeometry = geojson.fromWKT(wkt);
					expect(JSON.stringify(geometry)).toBe(JSON.stringify(convertedGeometry));
				}
				testToWKTAndBack(geojson.createPoint(10, 10));
				testToWKTAndBack(geojson.createLineString(0, 0, 10, 10, 10, 0));
				var polygon = geojson.createPolygon([ 0, 0, 10, 10, 10, 0, 0, 0 ], [ [ 2, 2, 8, 8, 8, 2, 2, 2 ] ]);
				testToWKTAndBack(polygon);
				testToWKTAndBack(geojson.createMultiPolygon([ polygon ]));
				done();
			});
		});
	});
});
