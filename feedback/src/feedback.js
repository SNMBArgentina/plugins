define([ 'message-bus', 'customization', 'toolbar', 'i18n', 'jquery', 'ui/ui', 'geojson/geojson' ], //
function(bus, customization, toolbar, i18n, $, ui, geojson) {
	var feedbackLayers = {};

	// Dialog controls
	var dialogId = 'feedback_popup';
	var lblTimestamp;
	var layerInput, emailInput, commentInput;

	var feedbackLayerId = 'feedbackLayer';
	var features = {};

	ui.create('button', {
		id: 'feedback-button',
		parent: toolbar.attr('id'),
		css: 'blue_button toolbar_button',
		html: 'Feedback',
		clickEventName: 'activate-feedback'
	});

	ui.create('dialog', {
		id: dialogId,
		parent: document.body,
		title: i18n.feedback_title,
		closeButton: true
	});

	layerInput = ui.create('choice', {
		id: 'feedback-input-layer',
		parent: dialogId,
		label: 'Capa: ' // i18n["Feedback.layer"]
	});
	layerInput.addEventListener('input', refreshYear);

	lblTimestamp = ui.create('span', {
		id: 'feedback-input-layer-date',
		parent: dialogId
	});

	ui.create('label', {
		id: 'feedback-input-tools-label',
		parent: dialogId,
		css: 'feedback-form-left',
		html: 'Drawing tools: '
	});

	ui.create('div', {
		id: 'feedback-controls',
		parent: dialogId
	});

	ui.create('button', {
		id: 'feedback-draw-control',
		parent: 'feedback-controls',
		css: 'blue_button toolbar_button',
		html: i18n.feedback_addfeature_tooltip,
		clickEventCallback: activateDrawControl
	});

	ui.create('button', {
		id: 'feedback-modify-control',
		parent: 'feedback-controls',
		css: 'blue_button toolbar_button',
		html: i18n.feedback_editfeature_tooltip,
		clickEventCallback: activateModifyControl
	});

	emailInput = ui.create('input', {
		id: 'feedback-input-email',
		parent: dialogId,
		label: 'Email: ' // i18n["Feedback.email"]
	});

	commentInput = ui.create('text-area', {
		id: 'feedback-input-comment',
		parent: dialogId,
		label: 'Comentario: ', // i18n["Feedback.comment"]
		cols: 40,
		rows: 6
	});

	ui.create('button', {
		id: 'feedback-send',
		parent: dialogId,
		css: 'dialog-ok-button',
		html: 'Send'
	});

	ui.create('button', {
		id: 'feedback-cancel',
		parent: dialogId,
		css: 'dialog-ok-button',
		html: 'Cancel',
		clickEventName: 'ui-hide',
		clickEventMessage: dialogId
	});

	bus.send('ui-form-collector:extend', {
		button: 'feedback-send',
		clickEventName: 'feedback-send',
		divs: [ 'feedback-input-layer', 'feedback-input-email', 'feedback-input-comment' ],
		names: [ 'layer', 'email', 'comment' ]
	});

	function activateDrawControl() {
		bus.send('activate-exclusive-control', {
			'controlIds': [ 'feedback-drawFeature' ]
		});
	}

	function activateModifyControl() {
		bus.send('activate-exclusive-control', {
			'controlIds': [ 'feedback-modifyFeature' ]
		});
	}

	bus
			.listen('feedback-send', function(e, msg) {
				var mailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if (msg.layer == null) {
					bus.send('error', i18n['Feedback.no-layer-selected']);
				} else if (!mailRegex.test(msg.email)) {
					bus.send('error', i18n['Feedback.invalid-email-address']);
				} else if (Object.keys(features).length == 0) {
					bus.send('error', i18n['Feedback.no-geometries']);
				} else {
					// Do submit
					var polygons = [];
					for ( var id in features) {
						polygons.push(features[id].geometry);
					}
					var multipolygon = geojson.createMultiPolygon(polygons);

					var data = {
						'lang': customization.languageCode,
						'comment': msg.comment,
						'geometry': geojson.toWKT(multipolygon),
						'layerName': msg.layer,
						'email': msg.email
					};

					var timestamp = feedbackLayers[msg.layer].timestamp;
					if (timestamp != null) {
						data.date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear();
					}

					bus.send('ui-loading:start', i18n['Feedback.wait']);

					bus.send('ajax', {
						type: 'POST',
						url: 'create-comment?',
						data: data,
						success: function(data, textStatus, jqXHR) {
							bus.send('info', i18n['Feedback.verify_mail_sent']);
							bus.send('ui-hide', dialogId);
						},
						errorMsg: i18n['Feedback.submit_error'],
						complete: function() {
							bus.send('ui-loading:end', i18n['Feedback.wait']);
						}
					});
				}
			});

	var activateFeedback = function() {
		if (layerInput.getElementsByTagName('option').length == 0) {
			bus.send('error', i18n['Feedback.no_layer_visible']);
		} else {
			bus.send('ui-button:feedback-button:activate', true);
			commentInput.value = '';
			emailInput.value = '';
			bus.send('map:addLayer', {
				'layerId': feedbackLayerId,
				'vector': {}
			});
			bus.send('map:createControl', {
				'controlId': 'feedback-drawFeature',
				'controlType': 'drawFeature',
				'editingLayerId': feedbackLayerId,
				'handlerType': 'polygon'
			});
			bus.send('map:createControl', {
				'controlId': 'feedback-modifyFeature',
				'controlType': 'modifyFeature',
				'editingLayerId': feedbackLayerId
			});
			activateDrawControl();
			features = {};

			bus.send('ui-show', 'feedback_popup');
		}
	};

	bus.listen('ui-hide', function(e, id) {
		if (id != dialogId) {
			return;
		}
		bus.send('activate-default-exclusive-control');
		bus.send('map:removeLayer', {
			'layerId': feedbackLayerId
		});
		features = {};

		bus.send('map:destroyControl', {
			'controlId': 'feedback-drawFeature'
		});
		bus.send('map:destroyControl', {
			'controlId': 'feedback-modifyFeature'
		});

		bus.send('ui-button:feedback-button:activate', false);
	});

	var refreshYear = function() {
		var text = '';
		var selectedLayer = feedbackLayers[layerInput.value];
		if (selectedLayer != null) {
			timestamp = selectedLayer.timestamp;
			if (timestamp != null) {
				text = timestamp.getUTCFullYear();
			}
		}
		lblTimestamp.innerHTML = text;
	};

	function keepFeature(e, message) {
		if (message.layerId == feedbackLayerId) {
			features[message.feature.id] = message.feature;
		}
	}
	bus.listen('map:featureAdded', keepFeature);
	bus.listen('map:featureModified', keepFeature);

	bus.listen('activate-feedback', activateFeedback);

	// Listen events
	bus.listen('layer-visibility', function(event, layerId, visibility) {
		if (layerId in feedbackLayers) {
			feedbackLayers[layerId].visibility = visibility;
			var currentValue = layerInput.value;
			var values = [];
			for (layerId in feedbackLayers) {
				var layerInfo = feedbackLayers[layerId];
				if (layerInfo.visibility) {
					values.push({
						text: layerInfo.name,
						value: layerId
					});
				}
			}

			bus.send('ui-choice-field:feedback-input-layer:set-values', [ values ]);
			if (currentValue != null && layerInput.querySelector("option[value='" + currentValue + "']")) {
				layerInput.value = currentValue;
			} else {
				var firstOption = layerInput.getElementsByTagName('option');
				if (firstOption && firstOption[0]) {
					layerInput.value = firstOption[0].value;
				}
			}
		}
	});

	bus.listen('reset-layers', function() {
		feedbackLayers = {};
	});

	bus.listen('add-layer', function(event, portalLayer) {
		if (portalLayer.feedback) {
			feedbackLayers[portalLayer.id] = {
				name: portalLayer.label,
				visibility: false
			};
		}
	});

	bus.listen('layer-timestamp-selected', function(event, layerId, timestamp) {
		if (layerId in feedbackLayers) {
			feedbackLayers[layerId].timestamp = timestamp;
			refreshYear();
		}
	});
});
