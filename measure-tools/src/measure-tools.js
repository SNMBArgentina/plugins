define(['message-bus', 'layout', 'ui/ui', 'ol2/controlRegistry'], function(bus, layout, ui, controlRegistry) {
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

    // Create the tooltip
	const tooltip = ui.create('div', {
        id: 'measure-tooltip',
        parent: layout.map.attr('id'),
		css: 'ol-tooltip'
	});

    let activated = {
        'line': false,
        'polygon': false
    }

    const sketchSymbolizers = {
        "Point": {
            pointRadius: 4,
            graphicName: "square",
            fillColor: "white",
            fillOpacity: 1,
            strokeWidth: 1,
            strokeOpacity: 1,
            strokeColor: "#333333"
        },
        "Line": {
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: "#666666",
            strokeDashstyle: "dash"
        },
        "Polygon": {
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeColor: "#666666",
            fillColor: "white",
            fillOpacity: 0.3
        }
    };

    const style = new OpenLayers.Style();
    style.addRules([
        new OpenLayers.Rule({symbolizer: sketchSymbolizers})
    ]);
    const styleMap = new OpenLayers.StyleMap({"default": style});

    const handleMeasurements = event => {
		let units = event.units;
		let order = event.order;
		let measure = event.measure;
        let out = "";
		
		if (order == 1) {
			out += "distancia: " + measure.toFixed(3) + " " + units;
		} else {
			out += "area: " + measure.toFixed(3) + " " + units + "2";
        }
        
        let text = document.createTextNode(out)
        text.id = 'measure-text'
		
		bus.listen('map:mousemove', (event, message) => {
            if (tooltip.childNodes.length !== 0) {
                tooltip.removeChild(tooltip.childNodes[0]);
            }
            tooltip.appendChild(text);
            tooltip.style.left = message.xy.x + 4
            tooltip.style.top = message.xy.y + 4
        })
    }
    
    controlRegistry.registerControl('measureControlArea', function(message) {
        let control = new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
            persist : true,
            handlerOptions : {
                layerOptions : {
                    styleMap: styleMap
                }
            }
        })

        control.events.on({
			"measure" : handleMeasurements,
			"measurepartial" : handleMeasurements
        });
        
        return control;
    });    
    
    controlRegistry.registerControl('measureControlLongitude', function(message) {
        let control = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
            persist : true,
            handlerOptions : {
                layerOptions : {
                    styleMap: styleMap
                }
            }
        })

        control.events.on({
			"measure" : handleMeasurements,
			"measurepartial" : handleMeasurements
        });
        
        return control;
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
