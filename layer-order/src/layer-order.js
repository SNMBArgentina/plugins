/**
 * @author Micho García
 */

'use strict';

define([ 'layout', 'module', 'toolbar', 'i18n', 'jquery', 'message-bus', 'ui/ui' ], function(layout, module, toolbar, i18n, $, bus, ui) {
	var layerRoot;
	var dialogId = 'layer-order-pane';
	var layers = [];

	bus.listen('layers-loaded', function(e, newLayersRoot) {
		layerRoot = JSON.parse(JSON.stringify(newLayersRoot));
	});

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
		css: 'layer-order-pane',
		closeButton: true
	});
	var content = ui.create('div', {
		id: dialogId + '-content',
		css: 'layer-order-pane-content',
		parent: dialogId
	});

	ui.sortable(content);
	content.addEventListener('change', (event) => {
		let layerId = event.detail.item.id.replace('-order-item', '');
		let index = event.detail.newIndex;
		bus.send('map:setLayerIndex', {
			layerId,
			index
		});
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

	function getLabelLayer (layerId) {
		const portalLayer = layerRoot.portalLayers.filter(thePortalLayer => thePortalLayer.layers.indexOf(layerId) !== -1);
		if (portalLayer && portalLayer.length === 1 && portalLayer[0].hasOwnProperty('label')) {
			return portalLayer[0].label;
		}
	};

	bus.listen('layers-loaded', function() {
		console.log(layerRoot);
		for (let n in layers) {
			var layer = layers[n];
			console.log(getLabelLayer(layer.id))
			ui.create('div', {
				id: `${layer.id}-order-item`,
				parent: dialogId + '-content',
				css: 'layer-order-item',
				html: getLabelLayer(layer.id)
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
