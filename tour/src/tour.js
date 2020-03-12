define(['module', 'toolbar', 'message-bus', 'jquery', 'ui/ui'], function(module, toolbar, bus, $, ui) {
	var steps = module.config().steps;

	var infoFeatures;

	function tooltipText(index, text) {
		var div = ui.create('div', {
			html: '<p>' + text + '</p>'
		});
		ui.create('button', {
			id: 'tour-next-' + index,
			parent: div,
			css: 'tour-button',
			html: 'Seguir'
		});
		ui.create('button', {
			id: 'tour-close-' + index,
			parent: div,
			css: 'tour-button',
			html: 'Cerrar'
		});
		return div.innerHTML;
	}

	var showStep = function(stepIndex) {
		var step = steps[stepIndex];

		var tooltip = ui.tooltip(step.id, {
			text: tooltipText(stepIndex, step.text),
			location: step.location
		});

		var btnNext = $('#tour-next-' + stepIndex);
		btnNext.focus();
		btnNext.click(function() {
			tooltip.parentNode.removeChild(tooltip);
			for (nextEvent in step.next) {
				var times = 1;
				if (!isNaN(parseInt(nextEvent.charAt(0)))) {
					times = parseInt(nextEvent.charAt(0));
					nextEvent = nextEvent.substr(1);
				}
				for (var i = 0; i < times; i++) {
					var parameters = step.next[nextEvent];
					for (paramIndex in parameters) {
						var parameter = parameters[paramIndex];
						if (typeof parameter === 'string' && parameter.charAt(0) == 'X') {
							parameters[paramIndex] = eval(parameter.substr(1));
						}
					}
					bus.send(nextEvent, parameters);
				}
			}

			if (step.wait) {
				var fnc;
				fnc = function() {
					showStep(stepIndex + 1);
					bus.stopListen(step.wait, fnc);
				};
				bus.listen(step.wait, fnc);
			} else {
				showStep(stepIndex + 1);
			}
		});
		$('#tour-close-' + stepIndex).click(function() {
			tooltip.parentNode.removeChild(tooltip);
		});
	};

	ui.create('button', {
		id: 'tour-button',
		parent: toolbar.attr('id'),
		css: 'blue_button toolbar_button',
		html: 'Guía interactiva',
		clickEventCallback: function() {
			showStep(0);
		}
	});

	/*
	 * helpers to highlight and zoom info features
	 */
	bus.listen('info-features', function(event, wmsLayerId, features, x, y) {
		infoFeatures = features;
	});
	bus.listen('highlight-info-feature', function(event, index) {
		bus.send('highlight-feature', infoFeatures[index].highlightGeom);
	});
	bus.listen('zoom-info-feature', function(event, index) {
		bus.send('zoom-to', infoFeatures[index].bounds.scale(1.2));
	});
});
