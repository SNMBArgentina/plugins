define([ 'message-bus', './map' ], function(bus, map) {
	var controlTypeCreatorFunction = {};
	var idControlInstance = {};

	bus.listen('map:createControl', function(e, message) {
		if (controlTypeCreatorFunction.hasOwnProperty(message.controlType)) {
			var control = controlTypeCreatorFunction[message.controlType](message);
			map.getMap().addControl(control);
			idControlInstance[message.controlId] = {
				'control': control,
				'configuration': JSON.parse(JSON.stringify(message))
			};
		}
	});

	function checkControlId(controlId) {
		if (!idControlInstance.hasOwnProperty(controlId)) {
			throw 'control id not found: ' + controlId;
		}
	}

	bus.listen('map:activateControl', function(e, message) {
		checkControlId(message.controlId);
		var control = idControlInstance[message.controlId].control;
		control.activate();
	});

	bus.listen('map:deactivateControl', function(e, message) {
		checkControlId(message.controlId);
		var control = idControlInstance[message.controlId].control;
		control.deactivate();
	});

	bus.listen('map:updateControl', function(e, message) {
		checkControlId(message.controlId);
		var controlConfiguration = idControlInstance[message.controlId].configuration;
		for ( var attrname in message) {
			configuration[attrname] = message[attrname];
		}
	});

	bus.listen('map:destroyControl', function(e, message) {
		checkControlId(message.controlId);
		var control = idControlInstance[message.controlId].control;
		control.deactivate();
		map.getMap().removeControl(control);
	});

	return {
		'registerControl': function(controlTypeName, controlCreatorFunction) {
			controlTypeCreatorFunction[controlTypeName] = controlCreatorFunction;
		}
	};
});
