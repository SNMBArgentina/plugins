define(['message-bus', 'layout', 'ui/ui', 'ol2/controlRegistry', 'ol2/map' ], function(bus, layout, ui, controlRegistry, map) {
	ui.create('button', {
		id: 'toggle_measure_area',
		parent: layout.map.attr('id'),
		clickEventName: 'toogle-measure-area'
	});
	ui.create('button', {
		id: 'toggle_measure_longitude',
		parent: layout.map.attr('id'),
		clickEventName: 'toogle-measure-longitude'
    });

    let activated = {
        'line': false,
        'polygon': false
    }
    
    controlRegistry.registerControl('measureControlArea', function(message) {
        return new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
            persist : true,
            handlerOptions : {
                layerOptions : {}
            }
        })
    });    
    
    controlRegistry.registerControl('measureControlLongitude', function(message) {
        return new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
            persist : true,
            handlerOptions : {
                layerOptions : {}
            }
        })
    });
    
    bus.listen('modules-loaded', function(e, message) {
        bus.send('map:createControl', {
            'controlId': 'measureControlLongitude',
            'controlType': 'measureControlLongitude'
        });

        bus.send('map:createControl', {
            'controlId': 'measureControlArea',
            'controlType': 'measureControlArea'
        });
    });
    
    bus.listen('toogle-measure-longitude', (e) => {
        if (activated.line) {
            bus.send('map:deactivateControl', {
                'controlId': 'measureControlLongitude'
            });
        } else {
            bus.send('map:activateControl', {
                'controlId': 'measureControlLongitude'
            });
        }
        activated.line = !activated.line
    });
    
    bus.listen('toogle-measure-area', (e) => {
        if (activated.polygon) {
            bus.send('map:deactivateControl', {
                'controlId': 'measureControlArea'
            });
        } else {
            bus.send('map:activateControl', {
                'controlId': 'measureControlArea'
            });
        }
        activated.polygon = !activated.polygon
    });
});
