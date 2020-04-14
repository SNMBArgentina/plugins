define([ 'i18n', './layers-schema', './layers-api', 'message-bus', 'jquery', 'ui/ui' ], function(i18n, schema, layerRoot, bus, $, ui) {
	var DIALOG_ID = 'layers-editor-dialog';
	var FORM_ID = 'layers-editor-dialog-form';
	var form;

	// Grab panel definitions
	var definitions = {
		'server': {
			'default-server': schema.properties['default-server']
		},
		'toc': schema.definitions.toc.properties,
		'portalLayer': schema.definitions.portalLayer.allOf[1].properties,
		'wmsLayer-base': schema.definitions['wmsLayer-base'].properties,
		'wmsLayer-wmsType': schema.definitions['wmsLayer-wmsType'].allOf[1].properties,
		'wmsLayer-osmType': schema.definitions['wmsLayer-osmType'].allOf[1].properties,
		'wmsLayer-gmapsType': schema.definitions['wmsLayer-gmapsType'].allOf[1].properties
	};

	// We assume 1:1 between portalLayer and wmsLayer, so this is tricked
	delete definitions.portalLayer.layers;
	// Layer type is already shown as an wmsLayer-base property
	delete definitions['wmsLayer-wmsType'].type;
	delete definitions['wmsLayer-osmType'].type;
	delete definitions['wmsLayer-gmapsType'].type;

	function editLayer(id) {
		createDialog(i18n['layers-editor.edit_layer_title'], function() {
			saveLayer();
		});

		definitions.toc.id.disabled = true;
		definitions['wmsLayer-base'].id.disabled = true;

		var portalValues = layerRoot.getPortalLayer(id);
		addPortalLayerFields(portalValues);

		if (portalValues.layers && portalValues.layers[0]) {
			var wmsValues = layerRoot.getMapLayer(portalValues.layers[0]);
			addWmsLayerFields(wmsValues);
		}

		definitions.toc.id.disabled = undefined;
		definitions['wmsLayer-base'].id.disabled = undefined;
	}

	function editGroup(id) {
		createDialog(i18n['layers-editor.edit_group_title'], function() {
			saveGroup();
		});
		addTocFields(layerRoot.getGroup(id));
	}

	function newLayer(groupId) {
		createDialog(i18n['layers-editor.new_layer_title'], function() {
			addNewLayer(groupId);
		});

		var id = 'unique-id-' + new Date().getTime();
		addPortalLayerFields({
			'id': id,
			'label': i18n['layers-editor.new_layer_label'],
			'active': 'true'
		});
		addWmsLayerFields({
			'id': id
		});
	}

	function newGroup() {
		createDialog(i18n['layers-editor.new_group_title'], function() {
			addNewGroup();
		});

		addTocFields({
			'id': 'unique-id-' + (new Date()).getTime(),
			'label': i18n['layers-editor.new_group']
		});
	}

	function createDialog(title, applyCallback) {
		if (document.getElementById(DIALOG_ID)) {
			bus.send('ui-show', DIALOG_ID);
			form.empty();
			return;
		}

		ui.create('dialog', {
			id: DIALOG_ID,
			parent: 'map',
			title: title,
			closeButton: true,
			visible: true
		});

		form = ui.create('form', {
			id: FORM_ID,
			parent: DIALOG_ID,
			css: FORM_ID
		});
		form = $(form);

		ui.create('button', {
			id: 'layers-editor-cancel',
			parent: DIALOG_ID,
			css: 'dialog-ok-button',
			html: i18n['layers-editor.cancel'] || 'Cancel',
			clickEventName: 'ui-hide',
			clickEventMessage: DIALOG_ID
		});

		var apply = ui.create('button', {
			id: 'layers-editor-apply',
			parent: DIALOG_ID,
			css: 'dialog-ok-button',
			html: i18n['layers-editor.apply'] || 'Apply'
		});
		apply.addEventListener('click', function(event) {
			if (event.button == 0) {
				applyCallback();
				bus.send('ui-hide', DIALOG_ID);
			}
		});
	}

	function addTocFields(values) {
		addFields(i18n['layers-editor.panel_layer_description'], 'toc', values);
	}

	function addPortalLayerFields(values) {
		addTocFields(values);
		addFields(i18n['layers-editor.panel_layer_properties'], 'portalLayer', values);
	}

	function addWmsLayerFields(values) {
		var fieldset = addFields(i18n['layers-editor.panel_layer_datasource'], 'wmsLayer-base', values);
		document.getElementById(fieldset.id + '-type').addEventListener('change', function() {
			setLayerType(this.value, values);
		});

		setLayerType(values.type || 'wms', values);
	}

	function setLayerType(type, values) {
		var types = {
			wms: {
				label: i18n['layers-editor.wms'],
				definition: 'wmsLayer-wmsType'
			},
			osm: {
				label: i18n['layers-editor.osm'],
				definition: 'wmsLayer-osmType'
			},
			gmaps: {
				label: i18n['layers-editor.google'],
				definition: 'wmsLayer-gmapsType'
			}
		};
		for ( var t in types) {
			removePanel(types[t].definition);
		}
		fieldset = addFields(types[type].label, types[type].definition, values);

		if (type == 'wms') {
			var input = document.getElementById(fieldset.id + '-baseUrl');
			var wmsName = document.getElementById(fieldset.id + '-wmsName');

			var loading = ui.create('div', {
				id: 'layers-editor-wms-loading',
				parent: wmsName.parentNode,
				css: 'layers-editor-wms-loading'
			});
			var error = ui.create('div', {
				id: 'layers-editor-wms-error',
				parent: wmsName.parentNode,
				css: 'layers-editor-wms-error'
			});

			var change = function() {
				var url = input.value + '?SERVICE=wms&VERSION=1.1.1&REQUEST=GetCapabilities';
				if (!url.startsWith('http')) {
					url = layerRoot.getDefaultServer() + url;
				}

				wmsName.innerHTML = '';
				bus.send('ui-show', 'layers-editor-wms-loading');
				bus.send('ui-hide', 'layers-editor-wms-error');

				$.ajax({
					type: 'GET',
					url: 'proxy?url=' + encodeURIComponent(url),
					dataType: 'xml'
				}).success(function(response) {
					var iterator = response.evaluate('//Capability/Layer/Layer', response, null, 0, null);
					var layer = iterator.iterateNext();

					var values = [];
					while (layer) {
						values.push(layer.getElementsByTagName('Name')[0].textContent);
						layer = iterator.iterateNext();
					}

					bus.send('ui-choice-field:' + fieldset.id + '-wmsName:set-values', [ values ]);
				}).error(function(e) {
					bus.send('ui-show', 'layers-editor-wms-error');
					console.log(e);
				}).always(function() {
					bus.send('ui-hide', 'layers-editor-wms-loading');
				});
			};

			$(input).blur(change);
			$(input).keypress(function(e) {
				if (e.which == 13) {
					change();
				}
			});

			change();
		}
	}

	function removePanel(name) {
		form.find('fieldset[class=' + name + ']').remove();
	}

	function addFields(title, panel, values) {
		var fieldset = ui.create('fieldset', {
			id: FORM_ID + '-fieldset-' + panel,
			parent: FORM_ID,
			css: panel
		});

		ui.create('legend', {
			id: fieldset.id + '-title-legend',
			parent: fieldset,
			html: title
		});

		for ( var name in definitions[panel]) {
			if (!definitions[panel][name].id) {
				definitions[panel][name].id = name;
			}
			addField(fieldset, definitions[panel][name], values[name]);
		}

		return fieldset;
	}

	var anyOfInputs = {};
	var fieldIndex = 0;
	function addField(fieldset, definition, value) {
		var input;
		var id = fieldset.id + '-' + (definition.id || fieldIndex++);
		if (definition.enum) {
			var values = [];
			for ( var e in definition.enum) {
				values.push(definition.enum[e]);
			}
			input = ui.create('choice', {
				id: id,
				parent: fieldset.id,
				label: definition.title,
				values: values
			});
			var option = input.querySelector("option[value='" + value + "']");
			if (option) {
				option.selected = true;
			}
		} else if (definition.type == 'string') {
			input = ui.create('input', {
				id: id,
				parent: fieldset.id,
				label: definition.title
			});
			if (value) {
				input.value = value;
			}
		} else if (definition.type == 'array') {
			input = ui.create('text-area', {
				id: id,
				parent: fieldset.id,
				label: definition.title,
				rows: value ? value.length + 1 : 3
			});
			input.value = value ? value.join('\r\n') : '';
		} else if (definition.type == 'boolean') {
			input = ui.create('checkbox', {
				id: id,
				parent: fieldset.id,
				label: definition.title
			});
			if (value) {
				input.checked = true;
			}
		} else if (definition.hasOwnProperty('anyOf')) {
			// WARNING: Shitty code ahead. It works for "legend" and
			// "inlineLengendUrl",
			// but will probably misbehave in other "anyOf" definition.
			var ul = ui.create('ul', {
				id: id,
				parent: fieldset.id,
				css: definition.id,
				html: definition.title
			});
			var alreadyChecked = false;
			anyOfInputs[definition.id] = {};
			for ( var i in definition.anyOf) {
				liId = id + '-' + i;
				var li = ui.create('li', {
					id: liId,
					parent: ul,
					css: definition.id
				});

				var choiceDef = definition.anyOf[i];
				var choice = ui.create('input', {
					id: liId + '-input',
					parent: liId,
					type: 'radio'
				});
				choice.name = definition.id;
				choice.value = i;

				if ((choiceDef.hasOwnProperty('enum') && choiceDef.enum.indexOf(value) != -1)) {
					choice.checked = true;
					alreadyChecked = true;
					anyOfInputs[definition.id][i] = addField(li, choiceDef, value);
				} else if (alreadyChecked) {
					anyOfInputs[definition.id][i] = addField(li, choiceDef, '');
				} else {
					choice.checked = true;
					anyOfInputs[definition.id][i] = addField(li, choiceDef, value);
				}
			}
		} else {
			ui.create('span', {
				id: id,
				parent: fieldset.id,
				css: 'layers-editor-type-not-implemented',
				html: i18n['layers-editor.unsupported_field']
			});
		}

		if (input) {
			if (definition.id) {
				input.name = definition.id;
			}
			if (definition.disabled) {
				input.disabled = true;
			}
			return input;
		}
	}

	function getFormValues() {
		var data = {};
		var fieldsets = form.find('fieldset');
		form.find(':input:disabled').removeAttr('disabled');

		// Process each of the fieldsets
		fieldsets.each(function(f, fieldset) {
			var panel = fieldset.className;
			var values = {};

			// Serialize all values except checkboxes (booleans)
			var arr = $(fieldset).find(':not(input[type=checkbox])').serializeArray();

			// Checkboxes have to be interpreted manually as booleans
			$(fieldset).find('input[type=checkbox]').each(function() {
				arr.push({
					name: this.name,
					value: this.checked
				});
			});

			// Get the values for each of the fields
			for ( var i in arr) {
				var field = arr[i];
				var name = field.name;
				var value = field.value;
				var definition = definitions[panel][name];

				if (definition.hasOwnProperty('enum')) {
					values[name] = value;
				} else if (definition.type == 'string') {
					// No text => no key entry
					values[name] = value;
				} else if (definition.type == 'array') {
					// Split string by line
					values[name] = value.match(/[^\r\n]+/g);
					if (!value) {
						values[name] = [];
					}
				} else if (definition.hasOwnProperty('anyOf')) {
					value = anyOfInputs[name][value].value;
					if (value.length > 0) {
						values[name] = value;
					}
				} else {
					// Default behaviour, assign the raw form value
					values[name] = value;
				}
			}
			data[panel] = values;
		});
		return data;
	}

	function saveServer() {
		var data = getFormValues();
		layerRoot.setDefaultServer(data.server['default-server']);
	}

	function saveGroup() {
		var data = getFormValues();
		layerRoot.getGroup(data.toc.id).merge(data.toc);
	}

	function addNewGroup() {
		var data = getFormValues();
		var group = $.extend({
			items: []
		}, data.toc);
		layerRoot.addGroup(group);
	}

	function buildWMSLayer() {
		var data = getFormValues();
		var wmsLayer = data['wmsLayer-base'];
		if (wmsLayer.type && wmsLayer.type == 'osm') {
			$.extend(wmsLayer, data['wmsLayer-osmType']);
		} else if (wmsLayer.type && wmsLayer.type == 'gmaps') {
			$.extend(wmsLayer, data['wmsLayer-gmapsType']);
		} else {
			$.extend(wmsLayer, data['wmsLayer-wmsType']);
		}

		return wmsLayer;
	}

	function buildPortalLayer(wmsLayerId) {
		var data = getFormValues();
		return $.extend({
			layers: [ wmsLayerId ]
		}, data.toc, data.portalLayer);
	}

	function saveLayer() {
		var wmsLayer = buildWMSLayer();
		var portalLayer = buildPortalLayer(wmsLayer.id);
		layerRoot.getMapLayer(wmsLayer.id).merge(wmsLayer);
		layerRoot.getPortalLayer(portalLayer.id).merge(portalLayer);
	}

	function addNewLayer(groupId) {
		var wmsLayer = buildWMSLayer();
		var portalLayer = buildPortalLayer(wmsLayer.id);
		layerRoot.addLayer(groupId, portalLayer, wmsLayer);
	}

	var loading = false;
	bus.listen('before-adding-layers', function() {
		loading = true;
	});
	bus.listen('layers-loaded', function() {
		loading = false;
	});

	bus.listen('add-layer', function(e, portalLayer) {
		if (loading) {
			return;
		}

		// Added manually after all layers have been loaded
		var clone = JSON.parse(JSON.stringify(portalLayer));

		var mapLayer = clone.mapLayers[0];
		var groupId = clone.groupId;

		clone.layers = clone.mapLayers.map(function(layer) {
			return layer.id;
		});
		clone.mapLayers = undefined;
		clone.groupId = undefined;

		layerRoot.addLayer(groupId, clone, mapLayer, false);
	});

	bus.listen('add-group', function(e, group) {
		if (loading) {
			return;
		}

		// Added manually after all layers have been loaded
		layerRoot.addGroup(JSON.parse(JSON.stringify(group)), false);
	});

	return {
		editLayer: editLayer,
		editGroup: editGroup,
		newLayer: newLayer,
		newGroup: newGroup
	};
});
