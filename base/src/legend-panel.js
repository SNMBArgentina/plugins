define([ 'jquery', 'i18n', 'customization', 'message-bus', 'layout', 'ui/ui' ], function($, i18n, customization, bus,
		layout, ui) {
	/*
	 * keep the information about layer legends that will be necessary when they
	 * become visible
	 */
	var legendArrayInfo = {};

	var dialogId = 'legend_panel';
	var divContent = null;

	ui.create('dialog', {
		id: dialogId,
		parent: document.body,
		title: i18n.legend_button,
		closeButton: true
	});

	var content = ui.create('div', {
		id: dialogId + '_content',
		parent: dialogId
	});

	var refreshLegendArray = function(legendArray) {
		for (var i = 0; i < legendArray.length; i++) {
			var legendInfo = legendArray[i];
			var id = dialogId + legendInfo.id;
			if (!legendInfo.visibility) {
				var elem = document.getElementById(id + '_container');
				if (elem) content.removeChild(elem);
				continue;
			}

			ui.create('div', {
				id: id + '_container',
				parent: dialogId + '_content',
				css: 'layer_legend_container'
			});
			ui.create('div', {
				id: id + '_header',
				parent: id + '_container',
				css: 'layer_legend_header'
			});
			ui.create('div', {
				id: id + '_layer_name',
				parent: id + '_header',
				html: legendInfo.label,
				css: 'layer_legend_name'
			});

			if (typeof legendInfo.sourceLink !== 'undefined' && typeof legendInfo.sourceLabel !== 'undefined') {
				ui.create('div', {
					id: id + '_source_label',
					parent: id + '_header',
					html: i18n.data_source + ': ',
					css: 'layer_legend_source_label'
				});
				ui.create('button', {
					id: id + '_source_link',
					parent: id + '_header',
					html: legendInfo.sourceLabel,
					css: 'layer_legend_source_link',
					clickEventName: 'ui-open-url',
					clickEventMessage: {
						url: legendInfo.sourceLink,
						target: '_blank'
					}
				});
			}

			var url = legendInfo.legendUrl;
			if (legendInfo.timeDependent && legendInfo.timestamp) {
				url = url + '&STYLE=' + legendInfo.timestyle + '&TIME=' + legendInfo.timestamp.toISO8601String();
			}
			ui.create('div', {
				id: id + '_img',
				parent: id + '_container',
				css: 'legend_image',
				html: "<img src='" + url + "'>"
			});
		}
	};

	bus.listen('open-legend', function(event, layerId) {
		bus.send('ui-show', dialogId);
	});

	bus.listen('toggle-legend', function() {
		bus.send('ui-toggle', dialogId);
	});

	bus.listen('reset-layers', function() {
		legendArrayInfo = {};
	});

	bus.listen('add-layer', function(event, layerInfo) {
		var legendArray = [];
		$.each(layerInfo.mapLayers, function(index, mapLayer) {
			if (mapLayer.hasOwnProperty('legend')) {
				legendArray.push({
					id: mapLayer.id,
					label: mapLayer.label,
					legendUrl: mapLayer.legendURL,
					sourceLink: mapLayer.sourceLink,
					sourceLabel: mapLayer.sourceLabel,
					visibility: layerInfo.active,
					timeDependent: layerInfo.hasOwnProperty('timeStyles')
				});
			}
		});
		if (legendArray.length > 0) {
			legendArrayInfo[layerInfo.id] = legendArray;
		}
	});

	bus.listen('layer-timestamp-selected', function(e, layerId, d, style) {
		var legendArray = legendArrayInfo[layerId];
		if (legendArray) {
			$.each(legendArray, function(index, legendInfo) {
				if (legendInfo.timeDependent) {
					legendInfo.timestamp = d;
					legendInfo.timestyle = style;
				}
			});

			refreshLegendArray(legendArray);
		}
	});

	bus.listen('layer-visibility', function(event, layerId, visibility) {
		var legendArray = legendArrayInfo[layerId] || [];
		$.each(legendArray, function(index, legendInfo) {
			legendInfo.visibility = visibility;
		});

		refreshLegendArray(legendArray);
	});
});
