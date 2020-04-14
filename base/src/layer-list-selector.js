define([ 'message-bus', 'layout', 'customization', 'i18n', 'ui/ui' ], function(bus, layout, customization, i18n, ui) {
	var divsById = {};
	var buttonPriorities = [];

	var contents = ui.create('div', {
		id: 'layers_container',
		parent: document.body
	});
	var buttons = ui.create('div', {
		id: 'layer_list_selector_pane',
		parent: document.body
	});
	buttons.style.display = 'none';

	bus.listen('show-layer-panel', function(event, id) {
		for ( var divId in divsById) {
			var active = (divId == id);
			divsById[divId].style.display = active ? '' : 'none';
			bus.send('ui-button:' + divId + ':activate', active);
		}
	});

	var registerLayerPanel = function(id, priority, text, content) {
		var button = ui.create('button', {
			id: id,
			parent: buttons,
			html: text,
			clickEventName: 'show-layer-panel',
			clickEventMessage: id
		});

		buttonPriorities.push({
			'id': id,
			'button': button,
			'priority': priority,
			'content': content
		});

		contents.appendChild(content);

		divsById[id] = content;
		renderButtons();
	};

	var removeLayerPanel = function(id) {
		buttons.removeChild(document.getElementById(id));
		for ( var i in buttonPriorities) {
			if (buttonPriorities[i].id == id) {
				// Remove div
				contents.removeChild(buttonPriorities[i].contentdiv);
				// Remove from buttonPriorities array
				buttonPriorities.splice(i, 1);
				break;
			}
		}
		// Remove from divsById
		delete divsById[id];
		renderButtons();
	};

	var renderButtons = function() {
		buttons.innerHTML = '';
		buttonPriorities.sort(function(a, b) {
			return a.priority - b.priority;
		});

		for (var i = 0; i < buttonPriorities.length; i++) {
			var bp = buttonPriorities[i];
			buttons.appendChild(bp.button);
		}

		bus.send('show-layer-panel', buttonPriorities[0].id);
		buttons.style.display = '';
	};

	bus.listen('modules-loaded', function() {
		renderButtons();
	});

	return {
		'registerLayerPanel': registerLayerPanel,
		'removeLayerPanel': removeLayerPanel
	};
});
