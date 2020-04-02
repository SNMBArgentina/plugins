define([ 'message-bus', './layers-edit-form', './layers-api', 'jquery', 'ui/ui', 'i18n' ], function(bus, forms, layerRoot, $, ui, i18n) {
	bus.listen('before-adding-layers', function() {
		bus.send('register-layer-action', function(layer) {
			return link(layer.id, forms.editLayer);
		});
		bus.send('register-group-action', function(group) {
			return link(group.id, forms.editGroup);
		});
		bus.send('register-group-action', function(group) {
			let action = ui.create('button', {
				css: 'editable-layer-list-button layer_newLayer_button',
				tooltip: i18n['tooltip.new_Layer'],
				clickEventCallback: function() {
					forms.newLayer(group.id);
				}
			});
			return $(action);
		});
		bus.send('register-group-action', function(group) {
			let action = ui.create('button', {
				css: 'editable-layer-list-button layer_newSubgroup_button',
				tooltip: i18n['tooltip.new_subGroup'],
				clickEventCallback: function() {
					forms.newSubgroup(group.id);
				}
			});
			return $(action);
		});
		bus.send('register-layer-action', function(layer) {
			let action = ui.create('button', {
				css: 'editable-layer-list-button layer_deleteLayer_button',
				tooltip: i18n['tooltip.removePortalLayer'],
				clickEventCallback: function() {
					layerRoot.removePortalLayer(layer.id);
				}
			});
			return $(action);
		});
		bus.send('register-group-action', function(group) {
			let action = ui.create('button', {
				css: 'editable-layer-list-button layer_deleteGroup_button',
				tooltip: i18n['tooltip.removeGroup'],
				clickEventCallback: function() {
					layerRoot.removeGroup(group.id);
				}
			});
			return $(action);
		});
	});

	function link(id, callback) {
		let action = ui.create('button', {
			css: 'editable-layer-list-button layer_edit_button',
			tooltip: i18n['tooltip.edit'],
			clickEventCallback: function() {
				callback.call(null, id);
			}
		});
		return $(action);
	}

	bus.listen('layers-loaded', function() {
		let button = document.getElementById('newGroupButton');
		if (button && button.parentNode) {
			button.parentNode.removeChild(button);
		}

		button = ui.create('button', {
			id: 'newGroupButton',
			css: 'blue_button',
			parent: 'layers_container',
			html: 'Nuevo grupo...',
			clickEventCallback: function() {
				forms.newGroup();
			}
		});

		function getGroupId(domId) {
			let id = domId.replace('all_layers_group_', '');
			id = id.replace('-container', '');
			return id;
		}

		function getLayerId(domId) {
			return domId.replace('-container', '');
		}

		function getParent(item) {
			let ancestor = item.parentNode;
			while (ancestor.id !== 'all_layers' && !ancestor.classList.contains('layer-list-accordion-container')) {
				ancestor = ancestor.parentNode;
			}
			return (ancestor.id === 'all_layers') ? null : getGroupId(ancestor.id);
		}

		let groupContainer = document.getElementById('all_layers');
		ui.sortable(groupContainer);
		groupContainer.addEventListener('change', function(e) {
			if (e.hasOwnProperty('detail')) {
				let item = e.detail.item;
				layerRoot.moveGroup(getGroupId(item.id), getParent(item), e.detail.newIndex);
			}
		});

		let containers = document.getElementsByClassName('layer-list-accordion accordion-content');
		Array.prototype.forEach.call(containers, function(container) {
			ui.sortable(container);
			container.addEventListener('change', function(e) {
				if (e.hasOwnProperty('detail')) {
					let item = e.detail.item;
					layerRoot.moveLayer(getLayerId(item.id), getParent(item), e.detail.newIndex);
				}
			});
		});
	});
});
