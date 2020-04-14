define([ 'module', 'jquery', 'message-bus', 'i18n', 'customization', 'ui/ui', 'geojson/geojson', 'highcharts', 'highcharts-theme-sand' ], function(module, $, bus, i18n, customization, ui, geojson) {
	var wmsLayerInfo = {};
	var infoFeatures = {};

	var pointHighlightLayerName = null;

	var dialog;
	var divResults;

	bus.listen('reset-layers', function() {
		wmsLayerInfo = {};
	});

	bus.listen('add-layer', function(event, layerInfo) {
		var portalLayerName = layerInfo.label;
		$.each(layerInfo.mapLayers, function(i, mapLayer) {
			if (mapLayer.queryType) {
				var aliases = null;
				if (mapLayer.queryFieldNames) {
					aliases = [];
					var fieldNames = mapLayer.queryFieldNames;
					var fieldAliases = mapLayer.queryFieldAliases;
					for (var j = 0; j < fieldNames.length; j++) {
						var alias = {
							'name': fieldNames[j],
							'alias': fieldAliases[j]
						};
						aliases.push(alias);
					}
				}

				wmsLayerInfo[mapLayer.id] = {
					'portalLayerName': portalLayerName,
					'wmsName': mapLayer.wmsName,
					'aliases': aliases
				};
			}
		});
	});

	bus.listen('clear-info-features', function() {
		if (dialog) {
			let elems = dialog.getElementsByClassName('info_dialog_results');
			for (let i = 0; i < elems.length; i++) {
				dialog.removeChild(elems[i]);
			}
		}

		infoFeatures = {};
		if (pointHighlightLayerName !== null) {
			bus.send('map:removeLayer', {
				'layerId': 'info-point-highlight-layer'
			});
			pointHighlightLayerName = null;
		}
	});

	bus.listen('info-features', function(event, wmsLayerId, features, x, y, mapPoint) {
		if (pointHighlightLayerName === null) {
			pointHighlightLayerName = 'info-point-highlight-layer';
			bus.send('map:addLayer', {
				'layerId': pointHighlightLayerName,
				'vector': {
					'style': {
						'default': {
							graphicName: 'cross',
							pointRadius: 10,
							strokeWidth: 1,
							strokeColor: '#000000',
							fillOpacity: 0.6,
							fillColor: '#ee4400'
						}
					}
				}
			});
			var f = geojson.createFeature(geojson.createPoint(
					mapPoint.x, mapPoint.y), {});
			bus.send('map:addFeature', {
				'layerId': pointHighlightLayerName,
				'feature': f
			});
		}

		infoFeatures[wmsLayerId] = features;

		dialog = ui.create('dialog', {
			id: 'info_popup',
			parent: document.body,
			title: i18n.info_dialog_title,
			closeButton: true
		});

		bus.listen('ui-hide', function(e, id) {
			if (id === 'info_popup') {
				bus.send('clear-info-features');
				bus.send('clear-highlighted-features');
			}
		});

		// TODO check if there is a custom pop up instead of showing the
		// standard one
		divResults = ui.create('div', {
			id: 'result_area_' + wmsLayerId,
			parent: dialog,
			css: 'info_dialog_results'
		});

		ui.create('div', {
			parent: divResults,
			css: 'layer_title_info_center',
			html: wmsLayerInfo[wmsLayerId].portalLayerName
		});

		var tableContainer = ui.create('div', {
			parent: divResults,
			css: 'layer_title_info_center'
		});

		var table = ui.create('table', {
			parent: tableContainer
		});

		var row = ui.create('tr', {
			parent: table,
			html: "<th class='command'><th class='command'>"
		});

		var aliases = wmsLayerInfo[wmsLayerId].aliases;
		if (aliases === null && features.length > 0) {
			var properties = features[0].properties;
			aliases = [];
			for (var propertyName in properties) {
				aliases.push({
					'name': propertyName,
					'alias': propertyName
				});
			}
		}
		for (let i = 0; i < aliases.length; i++) {
			ui.create('th', {
				parent: row,
				css: 'data',
				html: aliases[i].alias
			});
		}

		$.each(features, function(index, feature) {
			var tr = ui.create('tr', {
				parent: table
			});

			// Zoom to object button
			var tdMagnifier = ui.create('td', {
				parent: tr,
				css: 'command'
			});

			if (feature.bbox !== null) {
				ui.create('button', {
					id: 'info-magnifier-' + wmsLayerId + '-' + index,
					css: 'info-magnifier',
					parent: tdMagnifier,
					image: 'images/zoom-to-object.png',
					clickEventName: 'zoom-to',
					// the parameter is itself an array
					clickEventMessage: [ feature.bbox ]
				});
			}

			// Indicators button
			var tdIndicator = ui.create('td', {
				id: 'info-indicator-' + wmsLayerId + '-' + index,
				parent: tr,
				css: 'command'
			});
			var imgWait = ui.create('img', {
				parent: tdIndicator
			});
			imgWait.src = 'images/loader.gif';
			imgWait.alt = 'wait';
			imgWait.style.height = '20px';
			imgWait.style.width = '20px';
			var wmsName = wmsLayerInfo[wmsLayerId].wmsName;
			bus.send('ajax', {
				url: 'indicators?layerId=' + wmsName,
				success: function(indicators) {
					if (indicators.length > 0) {
						bus.send('feature-indicators-received',
							[ wmsName, wmsLayerId, index,
								indicators ]);
					}
				},
				errorMsg: 'Could not obtain the indicator',
				complete: function() {
					$(imgWait).remove();
				}
			});

			for (var i = 0; i < aliases.length; i++) {
				ui.create('td', {
					parent: tr,
					css: 'data',
					html: feature.properties[aliases[i].name]
				});
			}

			if (feature.highlightGeom !== null) {
				$(tr).mouseenter(function() {
					bus.send('highlight-feature', feature.highlightGeom);
				});
				$(tr).mouseleave(function() {
					bus.send('clear-highlighted-features');
				});
			}
		});

		// If no features selected then close the dialog
		if (features.length === 0) {
			bus.send('ui-hide', 'info_popup');
		} else {
			bus.send('ui-show', 'info_popup');
		}

		bus.listen('hide-info-features', function() {
			bus.send('ui-hide', 'info_popup');
		});
	});

	bus.listen('feature-indicators-received', function(event, wmsName,
			wmsLayerId, infoFeatureIndex, indicators) {
		infoFeatures[wmsLayerId][infoFeatureIndex].indicators = indicators;
		// TODO if there is more than one indicator, offer the
		// choice to the user.
		$(indicators).each(function(indicatorIndex, indicator) {
			// Muestra un icono para cada grafico con el
			// texto alternativo con el titulo del grafico.
			var button = ui.create('button', {
				id: 'info-indicator-' + wmsLayerId + '-' + infoFeatureIndex + '-' + indicatorIndex,
				parent: 'info-indicator-' + wmsLayerId + '-' + infoFeatureIndex,
				image: 'images/object-indicators.png',
				clickEventName: 'show-feature-indicator',
				clickEventMessage: [ wmsName, wmsLayerId, infoFeatureIndex, indicatorIndex ]
			});
			button.alt = indicator.title;
			button.title = indicator.title;
			// TODO Agregar separador entre iconos.
		});// END each
	});

	bus.listen('show-feature-indicator', function(event, wmsName, wmsLayerId,
			featureIndex, indicatorIndex) {
		var feature = infoFeatures[wmsLayerId][featureIndex];
		var indicator = feature.indicators[indicatorIndex];

		bus.send('ajax', {
			url: 'indicator?objectId=' + feature.properties[indicator.idField]
					+ //
					'&objectName=' + feature.properties[indicator.nameField] + //
					'&layerId=' + wmsName + //
					'&indicatorId=' + indicator.id,
			success: function(chartData) {
				var chart = $('<div/>');
				chart.highcharts(chartData);
				bus.send('show-info', [ indicator.title, chart[0] ]);
			},
			errorMsg: 'Could not obtain the indicator'
		});
	});
});
