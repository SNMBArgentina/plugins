define([ 'ui/ui' ], function(ui) {
	var header = ui.create('div', {
		id: 'header',
		parent: document.body
	});
	var center = ui.create('div', {
		id: 'center',
		parent: document.body
	});
	var map = ui.create('div', {
		id: 'map',
		parent: center
	});

	// disable text selection on Explorer (done with CSS in other browsers)
	$(function() {
		document.body.onselectstart = function() {
			return false;
		};
	});

	return {
		'header': $(header),
		'map': $(map)
	};
});
