define([ 'message-bus', 'module', 'i18n', 'ui/ui' ], function(bus, module, i18n, ui) {
	var config = module.config();

	// Optional. "left", "center" or "right". Defaults to "center".
	var align = config.align || 'center';

	bus.listen('modules-initialized', function(e, message) {
		var parent = null;
		if (config.hasOwnProperty('htmlId')) {
			parent = config.htmlId;
			if (parent == null) {
				parent = document.body;
			}
		} else {
			// backwards compatibility
			parent = 'map';
		}

		if (config.hasOwnProperty('html')) {
			ui.create('div', {
				id: 'footnote-container',
				parent: parent,
				html: config.html,
				css: 'footnote footnote-link'
			});
		} else {
			var container = ui.create('div', {
				id: 'footnote-container',
				parent: parent,
				css: 'footnote'
			});
			var links = [];
			if (config.hasOwnProperty('notes')) {
				for (var i = 0; i < config.notes.length; i++) {
					note = config.notes[i];
					links.push({
						text: i18n[note.text] || note.text,
						link: i18n[note.link] || note.link
					});
				}
			} else {
				links.push({
					text: i18n[config.text] || config.text,
					link: i18n[config.link] || config.link
				});
			}

			for (var i = 0; i < links.length; i++) {
				var a = ui.create('a', {
					id: 'footnote-link-' + i,
					parent: 'footnote-container',
					html: links[i].text,
					css: 'footnote-link'
				});
				a.href = links[i].link;
				a.target = '_blank';
				a.style['text-align'] = align;
				if (i < links.length - 1) {
					ui.create('span', {
						parent: 'footnote-container',
						html: ' - ',
						css: 'footnote-link'
					});
				}
			}
		}
	});
});
