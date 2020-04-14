define([ 'message-bus', 'ui/ui' ], function(bus, ui) {
	var DIALOG_ID = 'show-info-dialog';

	//Event bus show info dialog
	bus.listen('show-info', function(event, title, link) {
		//info dialog base
		var dialog = ui.create('dialog', {
			id: DIALOG_ID,
			parent: document.body,
			title: title,
			visible: true,
			closeButton: true
		});

		//Content dialog base
		var content = ui.create('div', {
			id: DIALOG_ID + '_content',
			parent: dialog
		});

		//if link is url in include html
		if (typeof link === 'string') {
			content.innerHTML = "<iframe width='100%' height='100%' src='" + link + "'>";
		} else {
			content.appendChild(link);
		}

		//event hide comportament
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

	//Event bus hide info dialog
	bus.listen('hide-info', function() {
		bus.send('ui-hide', DIALOG_ID);
	});
});
