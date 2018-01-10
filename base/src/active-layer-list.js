// layer-list is imported to have it first in the list
define([ 'jquery', 'message-bus', 'layer-list-selector', 'i18n', 'ui/ui', 'layer-list' ], function($, bus, layerListSelector, i18n, ui) {
	/*
	 * keep the information about the layers that will be necessary when they
	 * become visible
	 */
	var layersInfo = {};

	// Create the div
	var container = ui.create('div', {
		id: 'active_layers',
		css: 'layer_container_panel'
	});

	layerListSelector.registerLayerPanel('layers_transparency_selector', 20, i18n.selected_layers, container);

	function delLayer(layerId) {
		var e = document.getElementById(layerId + '_active_container');
		if (e) {
			container.removeChild(e);
		}
	}

	bus.listen('reset-layers', function() {
		for ( var layerId in layersInfo) {
			delLayer(layerId);
		}
		layersInfo = {};
	});

	bus.listen('add-layer', function(event, layerInfo) {
		// set the visibility flag to true if the layer is active and if it is
		// not a placeholder (placeholder means that no geospatial data to show
		// are associated)
		if (layerInfo.mapLayers && layerInfo.mapLayers.length > 0) {
			var activeLayerInfo = {
				label: layerInfo.label,
				opacity: 1
			};
			if (layerInfo.inlineLegendUrl) {
				activeLayerInfo.inlineLegendUrl = layerInfo.inlineLegendUrl;
			}
			layersInfo[layerInfo.id] = activeLayerInfo;
		}
	});

	bus.listen('layer-visibility', function(event, layerId, visibility) {
		var layerInfo = layersInfo[layerId];
		if (!layerInfo) {
			return;
		}

		function addLayer() {
			var layerContainer = ui.create('div', {
				id: layerId + '_active_container',
				parent: container,
				css: 'active_layer_container'
			});

			if (layerInfo.hasOwnProperty('inlineLegendUrl')) {
				ui.create('td', {
					parent: layerContainer,
					css: 'layer_legend',
					html: '<img class="inline-legend" src="' + layerInfo.inlineLegendUrl + '">'
				});
			}

			var slider = ui.create('slider', {
				id: layerId + '_transparency_slider',
				parent: layerContainer,
				label: layerInfo.label,
				values: [ 0, 100 ],
				value: 100 * layerInfo.opacity || 100,
				snap: false
			});
			slider.addEventListener('slide', function(e) {
				bus.send('transparency-slider-changed', [ layerId, e.detail.value / 100 ]);
			});
		}

		if (visibility) {
			addLayer(layerId);
		} else {
			delLayer(layerId);
		}
	});

	bus.listen('transparency-slider-changed', function(event, layerId, opacity) {
		var layerInfo = layersInfo[layerId];
		if (layerInfo) {
			layerInfo.opacity = opacity;
		}

		bus.send('ui-slider:' + layerId + '_transparency_slider:set-value', 100 * opacity);
	});

	return $(container);
});
