define([ 'jquery', 'message-bus', 'layout', 'layer-list-selector', 'moment', 'ui/ui' ], function($, bus, layout, layerListSelector, moment, ui) {
	var aTimestampsLayers = {};

	var sliders = {};
	var labels = {};
	var container = ui.create('div', {
		id: 'layerTimeSliders',
		css: 'layer_container_panel'
	});
	layerListSelector.registerLayerPanel('layer_slider_selector', 30, 'Temporal', container);

	function setLabel(id, date, dateFormat) {
		var label = labels[id] + ' (' + moment(date).format(dateFormat || 'YYYY') + ')';
		bus.send('ui-input:layer_time_slider_' + id + ':set-label', label);
	}

	bus.listen('reset-layers', function() {
		container.innerHTML = '';
		aTimestampsLayers = {};
		sliders = {};
		labels = {};
	});

	bus.listen('add-layer', function(event, layerInfo) {
		var layerTimestamps = layerInfo.timestamps;
		if (!layerTimestamps || !layerTimestamps.length) {
			return;
		}

		var timestamps = [];
		for (var i = 0; i < layerTimestamps.length; i++) {
			var d = new Date();
			d.setISO8601(layerTimestamps[i]);
			timestamps.push(d.getTime());
		}
		var lastTimestamp = timestamps[timestamps.length - 1];

		var slider = ui.create('slider', {
			id: 'layer_time_slider_' + layerInfo.id,
			parent: container,
			css: 'layer-time.slider',
			values: timestamps,
			value: lastTimestamp,
			snap: true
		});
		sliders[layerInfo.id] = slider;
		labels[layerInfo.id] = layerInfo.label;

		slider.addEventListener('change', function(event) {
			var date = new Date(event.detail.value);
			bus.send('layer-time-slider.selection', [ layerInfo.id, date ]);
		});

		slider.addEventListener('slide', function(event) {
			setLabel(layerInfo.id, new Date(event.detail.value), layerInfo['date-format']);
		});

		setLabel(layerInfo.id, new Date(lastTimestamp), layerInfo['date-format']);

		var timestampInfo = {
			'timestamps': timestamps
		};
		if (layerInfo['date-format']) {
			timestampInfo['date-format'] = layerInfo['date-format'];
		}

		aTimestampsLayers[layerInfo.id] = timestampInfo;
	});

	bus.listen('layer-timestamp-selected', function(e, layerId, d) {
		var timestampInfo = aTimestampsLayers[layerId];
		timestampInfo.timestamps.forEach(function(timestamp) {
			if (timestamp == d.getTime()) {
				bus.send('ui-slider:layer_time_slider_' + layerId + ':set-value', timestamp);
				setLabel(layerId, d, timestampInfo['date-format']);
			}
		});
	});

	bus.listen('layer-visibility', function(e, layerId, visible) {
		var slider = sliders[layerId];
		if (slider) {
			slider.style.display = visible ? '' : 'none';
		}
	});
});
