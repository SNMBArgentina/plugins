define(['message-bus', 'layout', 'ui/ui', 'ol2/controlRegistry'], function(bus, layout, ui, controlRegistry) {
    ui.create('button', {
        id: 'toggle_measure_area',
        parent: layout.map.attr('id'),
        css: 'measure_button',
        clickEventName: 'toogle-measure-area'
    });
    ui.create('button', {
        id: 'toggle_measure_longitude',
        parent: layout.map.attr('id'),
        css: 'measure_button',
        clickEventName: 'toogle-measure-longitude'
    });

    // Create the tooltip
    const tooltip = ui.create('div', {
        id: 'measure-tooltip',
        parent: layout.map.attr('id'),
        css: 'ol-tooltip'
    });

    let controlActivated = undefined

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

    function createText(event) {
        let units = event.units;
        let order = event.order;
        let measure = event.measure;
        let out = "";

        const significativeMeasure = parseFloat(measure.toPrecision(4));

        if (order == 1) {
            out += "distancia: " + significativeMeasure.toString() + " " + units;
        } else {
            out += "area: " + significativeMeasure.toString() + " " + units + "2";
        }

        let text = document.createTextNode(out)
        text.id = 'measure-text'

        return text
    }

    bus.listen('map:pixelfromlonlat', function(ev, message) {
        const $tooltip = $(tooltip)
        $tooltip.show()
        $tooltip.css('left', message.xy.x)
        $tooltip.css('top', message.xy.y)
    })

    function removeTooltip() {
        const $tooltip = $(tooltip)
        $tooltip.empty()
        $tooltip.hide()
    }

    function handleMeasure(event) {
        const text = createText(event);
        const $tooltip = $(tooltip)
        $tooltip.show()
        $tooltip.append($(text));
        bus.send('map:getpixelfromlonlat', {
            lon: event.geometry.getCentroid().x,
            lat: event.geometry.getCentroid().y
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
            "measure" : handleMeasure,
            "measurepartial": removeTooltip
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
            "measurepartial": removeTooltip
        });

        return control;
    });

    const CONTROLS = {
        'polygon': 'measureControlArea',
        'line': 'measureControlLongitude'
    }

    bus.listen('modules-loaded', function(e, message) {
        bus.send('map:createControl', {
            'controlId': CONTROLS.line,
            'controlType': CONTROLS.line
        });

        bus.send('map:createControl', {
            'controlId': CONTROLS.polygon,
            'controlType': CONTROLS.polygon
        });
    });

    function toogleActivation(controlType, controlId) {
        if (controlActivated && controlActivated === controlId) {
            bus.send('map:deactivateControl', {
                'controlId': CONTROLS[controlType]
            });
            controlActivated = undefined
            removeTooltip()
        } else if (controlActivated && controlActivated !== controlId ) {
            bus.send('map:deactivateControl', {
                'controlId': controlActivated
            });
            bus.send('map:activateControl', {
                'controlId': CONTROLS[controlType]
            });
            controlActivated = CONTROLS[controlType]
            removeTooltip()
        } else {
            bus.send('map:activateControl', {
                'controlId': CONTROLS[controlType]
            });
            controlActivated = CONTROLS[controlType]
        }
    }

    bus.listen('toogle-measure-longitude', e => {
        toogleActivation('line', 'measureControlLongitude');
    });

    bus.listen('toogle-measure-area', (e) => {
        toogleActivation('polygon', 'measureControlArea');
    });
});
