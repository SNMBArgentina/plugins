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
    
    let isFinished = true
    
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
    
    function toogleVisibilityTooltip() {
        const $tooltip = $(tooltip)
        if ($tooltip.is(":visible")) {
            $tooltip.hide()
        } else {
            $tooltip.show()
        }
    }
    
    function createText(event) {
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
        
        return text
    }
    
    function handleMeasurementPartial(event) {
        if (isFinished) {
            tooltip.removeChild(tooltip.childNodes[0]);
            bus.send('map:activatemousemove')
        }
        const text = createText(event)
        const callback = function(e, message) {
            if (tooltip.childNodes.length !== 0) {
                tooltip.removeChild(tooltip.childNodes[0]);
            }
            console.log(text)
            tooltip.appendChild(text);
            tooltip.style.left = message.xy.x + 4
            tooltip.style.top = message.xy.y + 4
        }
        bus.listen('map:mousemove', callback)
        isFinished = false;
    }
    
    function handleMeasure(event) {
        const text = createText(event);
        tooltip.removeChild(tooltip.childNodes[0]);
        tooltip.appendChild(text);
        bus.send('map:deactivatemousemove')
        isFinished = true
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
            "measure" : handleMeasure,
            "measurepartial" : handleMeasurementPartial
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
            "measure" : handleMeasure,
            "measurepartial" : handleMeasurementPartial
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
    
    function toogleActivation(controlType, controlId) {
        if (activated[controlType]) {
            bus.send('map:deactivateControl', {
                'controlId': controlId
            });
            bus.send('map:deactivatemousemove')
            tooltip.removeChild(tooltip.childNodes[0]);
        } else {
            bus.send('map:activateControl', {
                'controlId': controlId
            });
            bus.send('map:activatemousemove')
        }
        toogleVisibilityTooltip();
        activated[controlType] = !activated[controlType];
        isFinished = !isFinished;
    }
    
    bus.listen('toogle-measure-longitude', e => {
        toogleActivation('line', 'measureControlLongitude');
    });
    
    bus.listen('toogle-measure-area', (e) => {
        toogleActivation('polygon', 'measureControlArea');
    });
});