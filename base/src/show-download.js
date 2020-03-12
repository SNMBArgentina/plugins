define([ 'message-bus', 'ui/ui' ], function(bus, ui) {

	// Event bus show download dialog
	bus.listen('show-download', function(event, title, uri) {

		// the simplest possible approach: recreate a download link
		let link = document.createElement('a');
		// name of the link
		link.download = title;
		// URI of the file
		link.href = uri;
		// click on the link to let browser take care of it
		link.click();
	});
});
