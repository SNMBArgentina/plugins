define([ "module", "jquery", "message-bus", "i18n", "customization", "geojson/geojson",
		"highcharts", "highcharts-theme-sand" ], function(module, $, bus, i18n,
		customization, geojson) {

	var wmsLayerInfo = {};

	var infoFeatures = {};

	var pointHighlightLayerName = null;

	bus.listen("reset-layers", function() {
		wmsLayerInfo = {};
	});

	bus.listen("add-layer", function(event, layerInfo) {
		var portalLayerName = layerInfo.label;
		$.each(layerInfo.mapLayers, function(i, mapLayer) {
			wmsLayerInfo[mapLayer.id] = {
				"portalLayerName" : portalLayerName,
				"wmsName" : mapLayer.wmsName
			}
		});
	});

	bus.listen("clear-info-features", function(event, features, x, y) {
		$("#info_popup").empty();
		infoFeatures = {};
		if (pointHighlightLayerName != null) {
			bus.send("map:removeLayer", {
				"layerId" : "info-point-highlight-layer"
			});
			pointHighlightLayerName = null;
		}
	});

	bus.listen("info-features", function(event, wmsLayerId, features, x, y, mapPoint) {
		if (pointHighlightLayerName == null) {
			pointHighlightLayerName = "info-point-highlight-layer";
			bus.send("map:addLayer", {
				"layerId" : pointHighlightLayerName,
				"vector" : {
					"style" : {
						"default" : {
							graphicName : "cross",
							pointRadius : 10,
							strokeWidth : 1,
							strokeColor : "#000000",
							fillOpacity : 0.6,
							fillColor : "#ee4400"
						}
					}
				},
			});
			feature = geojson.createFeature(geojson.createPoint(
					mapPoint.x, mapPoint.y), {});
			bus.send("map:addFeature", {
				"layerId" : pointHighlightLayerName,
				"feature" : feature
			});
		}

		infoFeatures[wmsLayerId] = features;

		var infoPopup = $("#info_popup");
		if (infoPopup.length === 0) {
			infoPopup = $("<div/>").attr("id", "info_popup");
		}
		infoPopup.dialog({
			title : i18n["info_dialog_title"],
			closeOnEscape : false,
			width : 700,
			height : 200,
			resizable : true,
			close : function(event, ui) {
				bus.send("clear-info-features");
				bus.send("clear-highlighted-features");
			},
			autoOpen : false
		});

		// TODO check if there is a custom pop up instead of showing the
		// standard one

		var divResults = $("<div/>").attr("id",
				"result_area_" + wmsLayerId).appendTo(infoPopup);
		var layerNameFeatures = null;
		var layerName = wmsLayerInfo[wmsLayerId]["portalLayerName"];
		$("<div/>").addClass("layer_title info_center").html(layerName)
				.appendTo(divResults);
		var divTable = $("<div/>")
				.addClass("layer_results info_center").appendTo(
						divResults);
		var tblData = $("<table/>").appendTo(divTable);
		var tr = $("<tr/>").appendTo(tblData);

		$("<th/>").addClass("command").html("").appendTo(tr);
		$("<th/>").addClass("command").html("").appendTo(tr);
		var aliases = features[0]["aliases"];
		for (var i = 0; i < aliases.length; i++) {
			$("<th/>").addClass("data").html(aliases[i].alias)
					.appendTo(tr);
		}
		$.each(features, function(index, feature) {

			var tr = $("<tr/>").appendTo(tblData);

			// Zoom to object button
			var imgZoomToArea = $("<img/>").attr("id",
					"info-magnifier-" + wmsLayerId + "-" + index).attr(
					"src", "modules/images/zoom-to-object.png");
			imgZoomToArea.css("cursor", "pointer");
			var tdMagnifier = $("<td/>").addClass("command").appendTo(
					tr);

			if (feature["bounds"] != null) {
				tdMagnifier.append(imgZoomToArea);
				tdMagnifier.click(function() {
					bus.send("zoom-to", [ feature["bounds"].scale(1.2)
							.toArray() ]);
				});
			}

			// Indicators button
			var imgWait = $("<img/>").attr("src",
					"styles/images/ajax-loader.gif")
					.attr("alt", "wait");
			var tdIndicators = $("<td/>").attr("id",
					"info-indicator-" + wmsLayerId + "-" + index)
					.addClass("command").append(imgWait).appendTo(tr);
			var wmsName = wmsLayerInfo[wmsLayerId]["wmsName"];
			bus.send("ajax", {
				url : 'indicators?layerId=' + wmsName,
				success : function(indicators, textStatus, jqXHR) {
					if (indicators.length > 0) {
						bus.send("feature-indicators-received",
								[ wmsName, wmsLayerId, index,
										indicators ]);
					}
				},
				errorMsg : "Could not obtain the indicator",
				complete : function() {
					imgWait.remove();
				}
			});

			var aliases = feature["aliases"];
			for (var i = 0; i < aliases.length; i++) {
				$("<td/>").addClass("data").html(
						feature.attributes[aliases[i].name]).appendTo(
						tr);
			}

			if (feature["highlightGeom"] != null) {
				tr.mouseenter(function() {
					bus.send("highlight-feature",
							feature["highlightGeom"]);
				});
				tr.mouseleave(function() {
					bus.send("clear-highlighted-features");
				});
			}

		});

		// If no features selected then close the dialog
		if (features.length === 0) {
			infoPopup.dialog('close');
		} else {
			var openInCenter = module.config()["open-in-center"];
			// Don't reposition the dialog if already open
			if (!infoPopup.dialog('isOpen')) {
				var position;
				if (openInCenter) {
					position = {
						my : "center",
						at : "center",
						of : window
					};
				} else {
					var dialogX = x;
					var dialogY = y;
					position = {
						my : "left top",
						at : "left+" + dialogX + " top+" + dialogY,
						of : window,
						collision : "fit"
					};
				}

				infoPopup.dialog('option', 'position', position);

				// Finally open the dialog
				infoPopup.dialog('open');
				infoPopup.dialog('moveToTop');
			}
		}

		bus.listen("hide-info-features", function() {
			if (infoPopup) {
				infoPopup.dialog('close');
			}
		});
	});

	bus.listen("feature-indicators-received", function(event, wmsName,
			wmsLayerId, infoFeatureIndex, indicators) {
		infoFeatures[wmsLayerId][infoFeatureIndex]["indicators"] = indicators;
		// TODO if there is more than one indicator, offer the
		// choice to the user.
		$(indicators).each(
				function(indicatorIndex, indicator) {
					// Muestra un icono para cada grafico con el
					// texto alternativo con el titulo del grafico.
					var aIndicators = $("<a/>").attr(
							"id",
							"info-indicator-" + wmsLayerId + "-"
									+ infoFeatureIndex + "-" + indicatorIndex)
							.addClass("fancybox.iframe").appendTo(
									$("#info-indicator-" + wmsLayerId + "-"
											+ infoFeatureIndex));
					aIndicators.css("padding", "1px");
					$("<img/>").attr("src",
							"modules/images/object-indicators.png").appendTo(
							aIndicators);
					aIndicators.attr("alt", indicator.title);
					aIndicators.attr("title", indicator.title);
					aIndicators
							.click(function() {
								bus.send("show-feature-indicator", [ wmsName,
										wmsLayerId, infoFeatureIndex,
										indicatorIndex ]);
							});
					// TODO Agregar separador entre iconos.
				});// END each
	})

	bus.listen("show-feature-indicator", function(event, wmsName, wmsLayerId,
			featureIndex, indicatorIndex) {
		var feature = infoFeatures[wmsLayerId][featureIndex];
		var indicator = feature["indicators"][indicatorIndex];

		bus.send("ajax", {
			url : "indicator?objectId=" + feature.attributes[indicator.idField]
					+ //
					"&objectName=" + feature.attributes[indicator.nameField] + //
					"&layerId=" + wmsName + //
					"&indicatorId=" + indicator.id,
			success : function(chartData, textStatus, jqXHR) {
				var chart = $("<div/>");
				chart.highcharts(chartData);
				bus.send("show-info", [ indicator.title, chart ]);
			},
			errorMsg : "Could not obtain the indicator"
		});

	});
});