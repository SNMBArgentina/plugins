define([ 'message-bus', 'toolbar', 'customization', 'ui/ui' ], function(bus, toolbar, customization, ui) {
	var langs = customization.languages;
	for (var i = 0; i < langs.length; i++) {
		ui.create('button', {
			id: 'lang-button-' + langs[i].code,
			parent: toolbar.attr('id'),
			html: langs[i].name,
			css: 'blue_button toolbar_button lang_button',
			clickEventName: 'ui-open-url',
			clickEventMessage: {
				url: 'setlang?' + langs[i].code,
				target: '_self'
			}
		});
		bus.send('ui-button:lang-button-' + langs[i].code + ':activate', customization.languageCode == langs[i].code);
	}
});
