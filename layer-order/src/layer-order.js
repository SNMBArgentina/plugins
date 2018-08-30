/**
 * @author Micho García
 */

'use strict';

define([ 'layout', 'module', 'toolbar', 'i18n', 'jquery', 'message-bus', 'ui/ui' ], function(layout, module, toolbar, i18n, $, bus, ui) {
	var dialogId = 'layer-order-pane';

	var layers = [];

	// Create ui components
	ui.create('button', {
		id: 'order-button',
		parent: toolbar.attr('id'),
		css: 'blue_button toolbar_button',
		html: i18n.layer_order,
		clickEventName: 'ui-toggle',
		clickEventMessage: dialogId
	});

	ui.create('dialog', {
		id: dialogId,
		parent: layout.map.attr('id'),
		title: i18n.layer_order,
		closeButton: true
	});
	var content = ui.create('div', {
		id: dialogId + '-content',
		parent: dialogId
	});

	ui.sortable(content);
	content.addEventListener('change', function() {
		// TODO implementar
		// var newLayersOrder = jcontent.sortable('toArray');
		// for (var i = 0; i < newLayersOrder.length; i++) {
		// TODO update layers json and reload all layers
		// var id = newLayersOrder[i];
		// var layer = map.getLayer(id);
		// if (layer) {
		// map.setLayerIndex(layer, i);
		// }
		// }
	});

	// Link dialog visibility and toolbar button
	bus.listen('ui-toggle', function(e, id) {
		if (id === dialogId) {
			bus.send('ui-button:order-button:toggle');
		}
	});
	bus.listen('ui-hide', function(e, id) {
		if (id === dialogId) {
			bus.send('ui-button:order-button:activate', false);
		}
	});
	bus.listen('ui-show', function(e, id) {
		if (id === dialogId) {
			bus.send('ui-button:order-button:activate', true);
		}
	});

	// Update content according to layers
	bus.listen('reset-layers', function() {
		content.innerHTML = '';
	});

	bus.listen('layers-loaded', function() {
		for ( var n in layers) {
			var layer = layers[n];
			ui.create('div', {
				id: layer.id,
				parent: dialogId + '-content',
				css: 'layer-order-item',
				html: layer.id
			});
		}
	});

	bus.listen('add-layer', function(e, layerInfo) {
		for (var index = 0; index < layerInfo.mapLayers.length; index++) {
			var mapLayer = layerInfo.mapLayers[index];
			layers.push(mapLayer);
		}
	});
});
