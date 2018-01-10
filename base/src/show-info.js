define([ 'message-bus', 'ui/ui' ], function(bus, ui) {
	var DIALOG_ID = 'show-info-dialog';

	bus.listen('show-info', function(event, title, link) {
		var dialog = ui.create('dialog', {
			id: DIALOG_ID,
			parent: document.body,
			title: title,
			visible: true,
			closeButton: true
		});

		var content = ui.create('div', {
			id: DIALOG_ID + '_content',
			parent: dialog
		});

		if (typeof link === 'string') {
			content.innerHTML = "<iframe src='" + link + "'>";
		} else {
			content.appendChild(link);
		}

		bus.listen('ui-hide', function(e, id) {
			if (id == DIALOG_ID) {
				var elem = dialog;
				while (elem) {
					if (elem.parentNode == document.body) {
						document.body.removeChild(elem);
						break;
					}
					elem = elem.parentNode;
				}
			}
		});
	});

	bus.listen('hide-info', function() {
		bus.send('ui-hide', DIALOG_ID);
	});
});
