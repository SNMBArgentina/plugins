define([ "jquery", "message-bus", "layer-list-selector", "i18n", "moment", "jquery-ui", "fancy-box" ], function($, bus, layerListSelector, i18n, moment) {

	var layerActions, groupActions, temporalLayers, groupIdAccordionIndex, numTopLevelGroups, divLayers;

	var draw = function() {
		layerActions = [];
		groupActions = [];
		temporalLayers = [];
		groupIdAccordionIndex = {};
		numTopLevelGroups = 0;

		if (divLayers) {
			divLayers.remove();
			layerListSelector.removeLayerPanel("all_layers_selector");
		}
		divLayers = $("<div/>").attr("id", "all_layers");
		divLayers.addClass("group-container");
		divLayers.addClass("ui-accordion-icons");

		divLayers.accordion({
			"animate" : false,
			"header" : "> div > div.group-title",
			"heightStyle" : "content",
			// Collapse all content since otherwise the accordion sets the
			// 'display'
			// to 'block' instead than to 'table'
			"collapsible" : true,
			"active" : false
		});
		layerListSelector.registerLayerPanel("all_layers_selector", 10, i18n.layers, divLayers);
	};

	draw();

	bus.listen("reset-layers", draw);

	bus.listen("register-layer-action", function(event, action) {
		layerActions.push(action);
	});

	bus.listen("register-group-action", function(event, action) {
		groupActions.push(action);
	});

	bus.listen("add-group", function(event, groupInfo) {

		var divTitle = $("<div/>").html(groupInfo.label).disableSelection();
		divTitle.addClass("group-title");

		for (var i = 0; i < groupActions.length; i++) {
			var groupAction = groupActions[i];
			var element = groupAction(groupInfo);
			if (element != null) {
				// prevent accordion item from expanding
				// when clicking on the info button
				element.click(function(event) {
					event.stopPropagation()
				});
				element.addClass("group_info_button");
				divTitle.prepend(element);
			}
		}

		var tblLayerGroup = $("<table/>");
		tblLayerGroup.attr("id", "group-content-table-" + groupInfo.id);
		$("<tbody/>").addClass("layer-container").appendTo(tblLayerGroup);

		var divGroup = $("<div/>").addClass("group").attr("data-group", groupInfo.id);

		if (groupInfo.parentId) {
			var parentId = groupInfo.parentId;
			var tblParentLayerGroup = $("#group-content-table-" + parentId);
			tblParentLayerGroup.addClass("group-container");
			if (tblParentLayerGroup.length == 0) {
				bus.send("error", "Group " + groupInfo.label + " references nonexistent group: " + parentId);
			}
			tblParentLayerGroup.append(divGroup);
			divGroup.append(divTitle).append(tblLayerGroup);
		} else {
			divLayers.append(divGroup);
			divTitle.addClass("header");
			divGroup.append(divTitle);
			var divContent = $("<div/>").css("padding", "10px 2px 10px 2px");
			divContent.append(tblLayerGroup);
			divGroup.append(divContent);
			divLayers.accordion("refresh");
			groupIdAccordionIndex[groupInfo.id] = numTopLevelGroups;
			numTopLevelGroups++;
		}
	});

	bus.listen("add-layer", function(event, portalLayer) {
		var tblLayerGroup, trLayer, tdLegend, tdVisibility, divCheckbox, tdName, tdInfo, aLink, inlineLegend;

		tblLayerGroup = $("#group-content-table-" + portalLayer.groupId);
		if (tblLayerGroup.length == 0) {
			bus.send("error", "Layer " + portalLayer.label + " references nonexistent group: " + portalLayer.groupId);
		} else {
			trLayer = $("<tr/>").attr("id", "layer-row-" + portalLayer.id).addClass("layer_row");
			trLayer.attr("data-layer", portalLayer.id);

			tdLegend = $("<td/>").addClass("layer_legend");

			if (portalLayer.inlineLegendUrl != null) {
				inlineLegend = $('<img class="inline-legend" src="' + portalLayer.inlineLegendUrl + '">');
				tdLegend.append(inlineLegend);
			} else {
				var wmsLayersWithLegend = portalLayer.mapLayers.filter(function(layer) {
					return layer.hasOwnProperty("legend");
				});
				var wmsLayerWithLegend = wmsLayersWithLegend[0];

				if (wmsLayerWithLegend) {
					inlineLegend = $("<td/>");
					inlineLegend.addClass("inline-legend-button");
					inlineLegend.attr("id", "inline-legend-button-" + portalLayer.id);

					if (portalLayer.active) {
						inlineLegend.addClass("visible");
					}

					bus.listen("layer-visibility", function(event, layerId, visibility) {
						if (layerId != portalLayer.id) {
							return;
						}

						if (visibility) {
							inlineLegend.addClass("visible");
						} else {
							inlineLegend.removeClass("visible");
						}
					});

					inlineLegend.click(function() {
						if ($("#" + portalLayer.id + "_visibility_checkbox").hasClass("checked")) {
							bus.send("open-legend", wmsLayerWithLegend.id);
						}
					});

					tdLegend.append(inlineLegend);
				}
			}
			trLayer.append(tdLegend);

			tdVisibility = $("<td/>").css("width", "16px");
			divCheckbox = $("<div/>").attr("id", portalLayer.id + "_visibility_checkbox").addClass("layer_visibility");
			if (portalLayer.active) {
				divCheckbox.addClass("checked");
			}
			divCheckbox.mousedown(function() {
				divCheckbox.addClass("mousedown");
			}).mouseup(function() {
				divCheckbox.removeClass("mousedown");
			}).mouseenter(function() {
				divCheckbox.addClass("in");
			}).mouseleave(function() {
				divCheckbox.removeClass("in");
			}).click(function() {
				divCheckbox.toggleClass("checked");
				bus.send("layer-visibility", [ portalLayer.id, divCheckbox.hasClass("checked") ]);
			});

			if (portalLayer.mapLayers && portalLayer.mapLayers.length > 0) {
				tdVisibility.append(divCheckbox);
			}

			trLayer.append(tdVisibility);

			tdName = $("<td/>").addClass("layer_name");
			tdName.html(portalLayer.label);
			trLayer.append(tdName);

			for (var i = 0; i < layerActions.length; i++) {
				var layerAction = layerActions[i];
				var element = layerAction(portalLayer);
				tdAction = $("<td/>").addClass("layer_action").appendTo(trLayer);
				if (element != null) {
					tdAction.append(element);
				}
			}

			if (portalLayer.timestamps && portalLayer.timestamps.length > 0) {
				temporalLayers.push(portalLayer);
			}

			tblLayerGroup.append(trLayer);
			try {
				divLayers.accordion("refresh");
			} catch (e) {
				console.log(e);
			}
		}
	});

	bus.listen("layer-visibility", function(event, layerId, visible) {
		var divCheckbox = $("#" + layerId + "_visibility_checkbox");
		if (visible) {
			divCheckbox.addClass("checked");
		} else {
			divCheckbox.removeClass("checked");
		}
	});

	var updateLabel = function(layerId, layerFormat, date) {
		var tdLayerName = $("#layer-row-" + layerId + " .layer_name");
		tdLayerName.find("span").remove();
		var format;
		if (layerFormat) {
			format = layerFormat;
		} else {
			format = "YYYY";
		}
		var dateStr = moment(date).format(format);
		$("<span/>").html(" (" + dateStr + ")").appendTo(tdLayerName);
	};

	function findClosestPrevious(layer, date) {
		var layerTimestamps = layer.timestamps;
		var layerTimestampStyles = null;
		if (layer.hasOwnProperty("timeStyles")) {
			layerTimestampStyles = layer.timeStyles.split(",");
		}
		var timestampInfos = [];
		for (var j = 0; j < layerTimestamps.length; j++) {
			var timestamp = new Date();
			timestamp.setISO8601(layerTimestamps[j]);
			var style = null;
			if (layerTimestampStyles != null) {
				style = layerTimestampStyles[j];
			}
			var timestampInfo = {
				"timestamp" : timestamp,
				"style" : style
			};
			timestampInfos.push(timestampInfo);
		}

		timestampInfos.sort(function(infoA, infoB) {
			return infoA.timestamp.getTime() - infoB.timestamp.getTime();
		});

		var closestPrevious = null;

		for (var j = 0; j < timestampInfos.length; j++) {
			var timestampInfo = timestampInfos[j];
			if (timestampInfo.timestamp.getTime() <= date.getTime()) {
				closestPrevious = timestampInfo;
			} else {
				break;
			}
		}

		if (closestPrevious == null) {
			closestPrevious = timestampInfos[0];
		}

		return closestPrevious;
	}

	bus.listen("time-slider.selection", function(event, date) {
		for (var i = 0; i < temporalLayers.length; i++) {
			var layer = temporalLayers[i];

			var closestPrevious = findClosestPrevious(layer, date);
			updateLabel(layer.id, layer["date-format"], closestPrevious.timestamp);

			bus.send("layer-timestamp-selected", [ layer.id, closestPrevious.timestamp, closestPrevious.style ]);
		}
	});
	bus.listen("layer-time-slider.selection", function(event, layerid, date) {
		$.each(temporalLayers, function(index, temporalLayer) {
			if (temporalLayer.id == layerid) {
				var closestPrevious = findClosestPrevious(temporalLayer, date);
				updateLabel(layerid, temporalLayer["date-format"], closestPrevious.timestamp);
				bus.send("layer-timestamp-selected", [ layerid, closestPrevious.timestamp, closestPrevious.style ]);
			}
		});
	});

	bus.listen("show-layer-group", function(event, groupId) {
		if (groupIdAccordionIndex.hasOwnProperty(groupId)) {
			divLayers.accordion({
				"active" : groupIdAccordionIndex[groupId]
			});
		}
	});
});
