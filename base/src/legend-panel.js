define([ 'jquery', 'i18n', 'customization', 'message-bus', 'layout', 'ui/ui' ], function($, i18n, customization, bus,
		layout, ui) {
	/*
	 * keep the information about layer legends that will be necessary when they
	 * become visible
	 *
	 *
	 */

	//array of legend data from layers
	var legendArrayInfo = {};

	//last priority
	var legendLastPriority = 0;

	var dialogId = 'legend_panel';
	var divContent = null;

	//create dialog panel legend
	ui.create('dialog', {
		id: dialogId,
		parent: document.body,
		title: i18n.legend_button,
		closeButton: true
	});

	//create content _div all legend
	var content = ui.create('div', {
		id: dialogId + '_content',
		parent: dialogId
	});

	//handling of legend box components
	var refreshLegendArray = function(legendArray) {

		for (var i = 0; i < legendArray.length; i++) {

			var legendInfo = legendArray[i];
			var id = dialogId + legendInfo.id;

			// we get the total number of items in legend
			let totalLayers = document.getElementsByClassName("layer_legend_container").length;
			// the priority will be inversely proportional to the number of layers (more layers, more priority)
			// so that newly added layers are on top of the legend
			legendLastPriority -= 1; //we need the layer to have less priority than the last one
			let position = legendLastPriority;

			if (!legendInfo.visibility) {
				var elem = document.getElementById(id + '_container');
				if (elem) content.removeChild(elem);
				continue;
			}

			ui.create('div', {
				id: id + '_container',
				parent: dialogId + '_content',
				css: 'layer_legend_container',
				priority: position
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

			//if data from the source or label in white
			if (typeof legendInfo.sourceLink !== 'undefined' && typeof legendInfo.sourceLabel !== 'undefined' && legendInfo.sourceLabel !== '') {

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

			//compose url legend load in box
			var url = legendInfo.legendUrl;
			//I verify if the url is ows replacement by wms
			url = url.replace('/ows', '/wms');

			//include params time
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


	//Event open legend dialog
	bus.listen('open-legend', function(event, layerId) {
		bus.send('ui-show', dialogId);
	});


	//Event change legend dialog
	bus.listen('toggle-legend', function() {
		bus.send('ui-toggle', dialogId);
	});

	//Event clean layers
	bus.listen('reset-layers', function() {
		legendArrayInfo = {};
	});

	//Event add layers
	bus.listen('add-layer', function(event, layerInfo) {

		//if groupId <> to "base"
		if (layerInfo.groupId != 'base'){

			var legendArray = [];

			//if not label in wms layer set layer label
			var layerLabel = layerInfo.label;

			//I go through all the layers
			$.each(layerInfo.mapLayers, function(index, mapLayer) {

				var labelLegend = '';

				//If exist property legend
				if (mapLayer.hasOwnProperty('legend')) {

					if (mapLayer.label == ''){
						labelLegend = layerLabel;
					}else{
						labelLegend = mapLayer.label;
					}
					//push element in top array label
					legendArray.unshift({
						id: mapLayer.id,
						label: labelLegend,
						legendUrl: mapLayer.legendURL,
						sourceLink: mapLayer.sourceLink,
						sourceLabel: mapLayer.sourceLabel,
						visibility: layerInfo.active,
						timeDependent: layerInfo.hasOwnProperty('timeStyles')
					});
				}
			});

			//If is insert layer update is array legend
			if (legendArray.length > 0) {
				legendArrayInfo[layerInfo.id] = legendArray;
			}
		}
	});

	//Event change time of layer
	bus.listen('layer-timestamp-selected', function(e, layerId, d, style) {
		var legendArray = legendArrayInfo[layerId];
		if (legendArray) {
			$.each(legendArray, function(index, legendInfo) {
				if (legendInfo.timeDependent) {
					legendInfo.timestamp = d;
					legendInfo.timestyle = style;
				}
			});

			//Update legend box
			refreshLegendArray(legendArray);
		}
	});

	//Event change visibility of layer
	bus.listen('layer-visibility', function(event, layerId, visibility) {
		var legendArray = legendArrayInfo[layerId] || [];
		$.each(legendArray, function(index, legendInfo) {
			legendInfo.visibility = visibility;
		});

		//Update legend box
		refreshLegendArray(legendArray);
	});


});
