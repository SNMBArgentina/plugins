define([ 'jquery', 'message-bus', 'layer-list-selector', 'i18n', 'moment', 'ui/ui' ], function($, bus, layerListSelector, i18n, moment, ui) {
	// variables global
	var layerActions = [];
	var groupActions = [];
	var subGroupActions = [];
	var temporalLayers = [];
	var groupIdAccordionIndex = {};
	var numTopLevelGroups = 0;
	var layerGroups = {};
	var layerLabels = {};
	var layerDownload = {};

	var allLayers = ui.create('div', {
		id: 'all_layers',
		parent: 'layers_container',
		css: 'layers-accordion'
	});

	var toggleButton = ui.create('button', {
		id: 'toggle_layers_button',
		parent: layout.map.attr('id'),
		css: 'blue_button',
		html: "<<",
		clickEventName: 'toggle-layers'
	});

	//Event change legend dialog
	bus.listen('toggle-layers', function() {
		bus.send('ui-toggle', 'layers_container');
		bus.send('ui-toggle', 'layer_list_selector_pane');
		toggleIcon();
	});

	var toggleIcon = function() {
		var buttonDiv = toggleButton.firstElementChild;
		if(buttonDiv.innerHTML == "&gt;&gt;") buttonDiv.innerHTML = "&lt;&lt;";
		else buttonDiv.innerHTML = "&gt;&gt;";
	}

	layerListSelector.registerLayerPanel('all_layers_selector', 10, i18n.layers, all_layers);

	// ///Event//////

	bus.listen('reset-layers', function() {
		layerActions = [];
		groupActions = [];
		subGroupActions = [];
		temporalLayers = [];
		groupIdAccordionIndex = {};
		numTopLevelGroups = 0;
		allLayers.innerHTML = '';
	});

	bus.listen('register-layer-action', function(event, action) {
		layerActions.push(action);
	});

	bus.listen('register-group-action', function(event, action) {
		groupActions.push(action);
	});
	bus.listen('register-subgroup-action', function(event, action) {
		subGroupActions.push(action);
	});

	bus.listen('add-group', function(event, groupInfo) {
		var accordion;
		if (groupInfo.parentId) {
			accordion = 'all_layers_group_' + groupInfo.parentId;
		} else {
			accordion = 'all_layers';
			groupIdAccordionIndex[groupInfo.id] = numTopLevelGroups;
			numTopLevelGroups++;
		}

		var accordionGroup = ui.create('accordion-group', {
			id: 'all_layers_group_' + groupInfo.id,
			parent: accordion,
			css: 'layer-list-accordion',
			title: groupInfo.label
		});

		if (!groupInfo.parentId) {
			for (let i = 0; i < groupActions.length; i++) {
				let elem = groupActions[i](groupInfo);
				if (elem && accordionGroup.header) {
					accordionGroup.header.appendChild(elem[0]);
				}
			}
		} else {
			for (let i = 0; i < subGroupActions.length; i++) {
				let elem = subGroupActions[i](groupInfo);
				if (elem && accordionGroup.header) {
					accordionGroup.header.appendChild(elem[0]);
				}
			}
		}
	});

	bus.listen('add-layer', function(event, portalLayer) {
		layerGroups[portalLayer.id] = portalLayer.groupId;
		layerLabels[portalLayer.id] = portalLayer.label;
		layerDownload[portalLayer.id] = portalLayer.download;
		var parent = 'all_layers_group_' + portalLayer.groupId;

		var checkbox = ui.create('checkbox', {
			id: portalLayer.id,
			parent: parent,
			label: portalLayer.label
		});
		checkbox.addEventListener('change', function() {
			bus.send('layer-visibility', [ this.id, this.checked ]);
		});

		var legend;
		if (portalLayer.inlineLegendUrl !== null) {
			legend = ui.create('div', {
				id: 'layer_list_legend_' + portalLayer.id,
				css: 'inline-legend'
			});
		} else {
			var wmsLayersWithLegend = portalLayer.mapLayers.filter(function(layer) {
				return layer.hasOwnProperty('legend');
			});
			var wmsLayerWithLegend = wmsLayersWithLegend[0];
			if (wmsLayerWithLegend) {
				legend = ui.create('button', {
					id: 'inline-legend-button-' + portalLayer.id,
					css: portalLayer.active ? 'inline-legend-button visible' : 'inline-legend-button',
					clickEventName: 'open-legend',
					clickEventMessage: wmsLayerWithLegend.id
				});
			}
		}

		if (legend) {
			checkbox.parentNode.insertBefore(legend, checkbox);
		}

		bus.send('ui-accordion-group:' + parent + ':visibility', {
			header: true
		});

		for (var i = 0; i < layerActions.length; i++) {
			// Append actions after checkbox
			var elem = layerActions[i](portalLayer);
			if (elem) {
				checkbox.parentNode.appendChild(elem[0]);
			}
		}

		if (portalLayer.timestamps && portalLayer.timestamps.length > 0) {
			temporalLayers.push(portalLayer);
		}
	});

	bus.listen('layer-visibility', function(event, layerId, visible) {
		document.getElementById(layerId).checked = visible;
		var inlineLegend = $('#inline-legend-button-' + layerId);
		if (visible) {
			inlineLegend.addClass('visible');
		} else {
			inlineLegend.removeClass('visible');
		}
	});


	// ///Function////

	var updateLabel = function(layerId, layerFormat, date) {
		var dateStr = moment(date).format(layerFormat || 'YYYY');
		var label = layerLabels[layerId] + ' (' + dateStr + ')';
		bus.send('ui-input:' + layerId + ':set-label', label);
	};


	function findClosestPrevious(layer, date) {
		var layerTimestamps = layer.timestamps;
		var layerTimestampStyles = null;
		if (layer.hasOwnProperty('timeStyles')) {
			layerTimestampStyles = layer.timeStyles.split(',');
		}
		var timestampInfos = [];
		for (let j = 0; j < layerTimestamps.length; j++) {
			let timestamp = new Date();
			timestamp.setISO8601(layerTimestamps[j]);
			var style = null;
			if (layerTimestampStyles !== null) {
				style = layerTimestampStyles[j];
			}
			let timestampInfo = {
				'timestamp': timestamp,
				'style': style
			};
			timestampInfos.push(timestampInfo);
		}

		timestampInfos.sort(function(infoA, infoB) {
			return infoA.timestamp.getTime() - infoB.timestamp.getTime();
		});

		var closestPrevious = null;

		for (var j = 0; j < timestampInfos.length; j++) {
			let timestampInfo = timestampInfos[j];
			if (timestampInfo.timestamp.getTime() <= date.getTime()) {
				closestPrevious = timestampInfo;
			} else {
				break;
			}
		}

		if (closestPrevious === null) {
			closestPrevious = timestampInfos[0];
		}

		return closestPrevious;
	}


	// ///Event//////

	bus.listen('time-slider.selection', function(event, date) {
		for (var i = 0; i < temporalLayers.length; i++) {
			var layer = temporalLayers[i];

			var closestPrevious = findClosestPrevious(layer, date);
			updateLabel(layer.id, layer['date-format'], closestPrevious.timestamp);

			bus.send('layer-timestamp-selected', [ layer.id, closestPrevious.timestamp, closestPrevious.style ]);
		}
	});
	bus.listen('layer-time-slider.selection', function(event, layerid, date) {
		$.each(temporalLayers, function(index, temporalLayer) {
			if (temporalLayer.id === layerid) {
				var closestPrevious = findClosestPrevious(temporalLayer, date);
				updateLabel(layerid, temporalLayer['date-format'], closestPrevious.timestamp);
				bus.send('layer-timestamp-selected', [ layerid, closestPrevious.timestamp, closestPrevious.style ]);
			}
		});
	});

	bus.listen('show-layer-group', function(event, groupId) {
		bus.send('ui-accordion-group:all_layers_group_' + groupId + ':visibility', {
			header: true,
			content: true
		});
	});
});
