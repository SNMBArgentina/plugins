define([ 'message-bus', './layers-edit-form', './layers-api', 'jquery', 'ui/ui' ], function(bus, forms, layerRoot, $, ui) {
	bus.listen('before-adding-layers', function() {
		bus.send('register-layer-action', function(layer) {
			return linkEdit(layer.id, forms.editLayer);
		});
		bus.send('register-group-action', function(group) {
			return linkEdit(group.id, forms.editGroup);
		});
		bus.send('register-subGroup-action', function(group) {
			return linkEdit(group.id, forms.editGroup);
		});
		bus.send('register-group-action', function(group) {
			return linkNewLayer(group.id);
		});
		bus.send('register-subGroup-action', function(group) {
			return linkNewLayer(group.id);
		});
		bus.send('register-group-action', function(group) {
			return linkRemoveGroup(group.id);
		});
		bus.send('register-subGroup-action', function(group) {
			return linkRemoveGroup(group.id);
		});
		bus.send('register-group-action', function(group) {
			let action = ui.create('button', {
				css: 'editable-layer-list-button layer_newSubgroup_button',
				clickEventCallback: function() {
					forms.newSubgroup(group.id);
				}
			});
			return $(action);
		});
		bus.send('register-layer-action', function(layer) {
			let action = ui.create('button', {
				css: 'editable-layer-list-button layer_deleteLayer_button',
				clickEventCallback: function() {
					layerRoot.removePortalLayer(layer.id);
				}
			});
			return $(action);
		});
	});

	function linkEdit(id, callback) {
		let action = ui.create('button', {
			css: 'editable-layer-list-button layer_edit_button',
			clickEventCallback: function() {
				callback.call(null, id);
			}
		});
		return $(action);
	}

	function linkNewLayer(id) {
		let action = ui.create('button', {
			css: 'editable-layer-list-button layer_newLayer_button',
			clickEventCallback: function() {
				forms.newLayer(id);
			}
		});
		return $(action);
	}

	function linkRemoveGroup(id) {
		let action = ui.create('button', {
			css: 'editable-layer-list-button layer_deleteGroup_button',
			clickEventCallback: function() {
				layerRoot.removeGroup(id);
			}
		});
		return $(action);
	}

	bus.listen('layers-loaded', function() {
		var button = document.getElementById('newGroupButton');
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
					var item = e.detail.item;
					layerRoot.moveLayer(getLayerId(item.id), getParent(item), e.detail.newIndex);
				}
			});
		});
	});
});
