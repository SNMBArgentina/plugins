define([ 'module', 'message-bus', 'ui/ui' ], function(module, bus, ui) {
	var timestampSet = {};
	var slider;
	var container;

	bus.listen('modules-initialized', function(e, message) {
		var config = module.config();
		var htmlId = null;
		if (config.hasOwnProperty('htmlId')) {
			htmlId = config.htmlId;
		} else {
			// backwards compatibility
			htmlId = 'toolbar';
		}
		container = ui.create('div', {
			id: 'time_slider_pane',
			parent: htmlId,
			css: 'toolbar_button'
		});
		container.style.display = 'none';
	});

	function setLabel(date) {
		var label = date.toLocaleDateString(undefined, {
			month: 'short',
			year: 'numeric'
		});
		bus.send('ui-input:time-slider:set-label', label);
	}

	var draw = function() {
		var timestamps = Object.keys(timestampSet).sort();
		var lastTimestampIndex = timestamps.length - 1;

		if (timestamps.length > 0) {
			var values = timestamps.map(function(e) {
				return new Date(e).getTime();
			});
			var last = values[values.length - 1];

			slider = ui.create('slider', {
				id: 'time-slider',
				parent: container,
				values: values,
				value: last,
				snap: true
			});

			bus.send('time-slider.selection', new Date(last));

			var lastValue;
			slider.addEventListener('change', function(event) {
				lastValue = new Date(event.detail.value);
				bus.send('time-slider.selection', lastValue);
			});

			slider.addEventListener('slide', function(event) {
				setLabel(new Date(event.detail.value));
			});

			container.style.display = '';
			bus.listen('time-slider.selection', timeSliderSelection);

			var tmpDate = new Date(timestamps[lastTimestampIndex]);
			setLabel(tmpDate);

			function timeSliderSelection(event, date) {
				var timestamps = Object.keys(timestampSet);
				var d = new Date(lastValue);
				if (d.getTime() != date.getTime()) {
					for (var i = 0; i < timestamps.length; i++) {
						d = new Date(timestamps[i]);
						if (d.getTime() == date.getTime()) {
							bus.send('ui-slider:time-slider:set-value', d.getTime());
							setLabel(d);
							break;
						}
					}
				}
			}

			bus.listen('reset-layers', function() {
				bus.stopListen('time-slider.selection', timeSliderSelection);
			});
		}
	};

	bus.listen('add-layer', function(event, layerInfo) {
		var layerTimestamps = layerInfo.timestamps;
		if (layerTimestamps && layerTimestamps.length > 0) {
			for (var i = 0; i < layerTimestamps.length; i++) {
				timestampSet[layerTimestamps[i]] = true;
			}
		}
	});

	bus.listen('layers-loaded', draw);

	bus.listen('reset-layers', function() {
		timestampSet = {};
		container.innerHTML = '';
		container.style.display = 'none';
	});
});
