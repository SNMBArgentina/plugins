define([ 'layout', 'message-bus', 'module', 'jquery', 'ui/ui' ], function(layout, bus, module, $, ui) {
	var priorities = module.config();

	var divToolbar = ui.create('div', {
		id: 'toolbar',
		parent: layout.header[0]
	});
	divToolbar = $(divToolbar);

	bus.listen('modules-loaded', function() {
		var sortedChildren = divToolbar.children().sort(function(child1, child2) {
			var priority1 = priorities[$(child1).attr('id')];
			// If no priority, then zero
			priority1 = priority1 ? priority1 : 0;
			var priority2 = priorities[$(child2).attr('id')];
			// If no priority, then zero
			priority2 = priority2 ? priority2 : 0;
			if (priority1 > priority2) {
				return -1;
			} else if (priority1 < priority2) {
				return 1;
			}
			return 0;
		});
		divToolbar.append(sortedChildren);
	});

	return divToolbar;
});
