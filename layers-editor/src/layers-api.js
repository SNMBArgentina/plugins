define([ 'jquery', 'message-bus' ], function($, bus) {
	function process(array, processFunction) {
		for (var i = 0; i < array.length; i++) {
			if (processFunction(array[i], i)) {
				break;
			}
			if (array[i].hasOwnProperty('items')) {
				process(array[i].items, processFunction);
			}
		}
	}

	function findById(array, id) {
		if (id == null) {
			return null;
		}

		var ret = null;
		process(array, function(o) {
			if (o.id == id) {
				ret = o;
				return true;
			}
			return false;
		});

		return ret;
	}

	function decorateCommons(o) {
		o.merge = function(data) {
			$.extend(o, data);
			bus.send('layers-set-root', layerRoot);
		};
	}

	function doDeleteLayer(layerId) {
		function portalLayerRemovalFunction(testPortalLayer, i) {
			if (testPortalLayer.id == layerId) {
				layerRoot.portalLayers.splice(i, 1);

				if (testPortalLayer.layers) {
					var wmsLayerRemovalFunction = function(testWMSLayer, k) {
						if (testWMSLayer.id == wmsLayerId) {
							layerRoot.wmsLayers.splice(k, 1);
							return true;
						}

						return false;
					};
					for (var j = 0; j < testPortalLayer.layers.length; j++) {
						var wmsLayerId = testPortalLayer.layers[j];
						process(layerRoot.wmsLayers, wmsLayerRemovalFunction);
					}
				}

				return true;
			}

			return false;
		}
		process(layerRoot.portalLayers, portalLayerRemovalFunction);
	}

	function deleteAllGroupLayers(group) {
		for (var i = 0; i < group.items.length; i++) {
			var groupItem = group.items[i];
			if (typeof groupItem === 'string' || groupItem instanceof String) {
				doDeleteLayer(groupItem);
			} else if (groupItem.items) {
				deleteAllGroupLayers(groupItem);
			}
		}
	}

	function findAndDeleteGroup(array, groupId) {
		// Directly in the array
		for (var i = 0; i < array.length; i++) {
			if (array[i].id == groupId) {
				deleteAllGroupLayers(array[i]);
				array.splice(i, 1);
				return true;
			}
		}

		// Delegate on each group
		for (var i = 0; i < array.length; i++) {
			if (array[i].hasOwnProperty('items')) {
				if (findAndDeleteGroup(array[i].items, groupId)) {
					return true;
				}
			}
		}

		return false;
	}

	function decorateGroup(parentId, group) {
		decorateCommons(group);
		group.getParent = function() {
			return findById(layerRoot.groups, parentId);
		};
	}

	function decoratePortalLayer(portalLayer, groupId) {
		decorateCommons(portalLayer);

		if (portalLayer.layers) {
			portalLayer.layers.forEach(function(mapLayerId) {
				var mapLayer = findById(layerRoot.wmsLayers, mapLayerId);
				if (mapLayer !== null) {
					decorateCommons(mapLayer);
				}
			});
		}
	}

	function processGroup(parentId, group) {
		decorateGroup(parentId, group);
		group.items.forEach(function(item) {
			if (typeof item === 'object') {
				processGroup(group.id, item);
			} else {
				var portalLayer = findById(layerRoot.portalLayers, item);
				if (portalLayer !== null) {
					decoratePortalLayer(portalLayer, group.id);
				}
			}
		});
	}

	var layerRoot;
	bus.listen('layers-loaded', function(e, newLayersRoot) {
		layerRoot = JSON.parse(JSON.stringify(newLayersRoot));
		layerRoot.groups.forEach(function(group) {
			processGroup(null, group);
		});
	});

	return {
		getGroup: function(groupId) {
			return findById(layerRoot.groups, groupId);
		},
		getPortalLayer: function(layerId) {
			return findById(layerRoot.portalLayers, layerId);
		},
		getMapLayer: function(layerId) {
			return findById(layerRoot.wmsLayers, layerId);
		},
		addGroup: function(group, sendSetRoot) {
			layerRoot.groups.push(group);
			decorateGroup(null, group);

			if (sendSetRoot || sendSetRoot === undefined) {
				bus.send('layers-set-root', layerRoot);
			}
		},
		addLayer: function(groupId, portalLayer, wmsLayer, sendSetRoot) {
			var group = findById(layerRoot.groups, groupId);
			group.items.push(portalLayer.id);

			layerRoot.wmsLayers.push(wmsLayer);
			decorateCommons(wmsLayer);

			layerRoot.portalLayers.push(portalLayer);
			decoratePortalLayer(portalLayer);

			if (sendSetRoot || sendSetRoot === undefined) {
				bus.send('layers-set-root', layerRoot);
			}
		},
		moveGroup: function(groupId, parentId, newPosition) {
			var group = findById(layerRoot.groups, groupId);

			// delete
			var sourceItemsArray = layerRoot.groups;
			var parentGroup = group.getParent();
			if (parentGroup !== null) {
				sourceItemsArray = parentGroup.items;
			}
			var sourceIndex = -1;
			for (var i = 0; i < sourceItemsArray.length; i++) {
				if (sourceItemsArray[i].id == groupId) {
					sourceIndex = i;
					break;
				}
			}
			var sameGroup = (group.parentId === null && parentId === null) || group.parentId == parentId;
			if (!sameGroup || sourceIndex != newPosition) {
				sourceItemsArray.splice(sourceIndex, 1);

				// insert
				var itemsArray = layerRoot.groups;
				if (parentId !== null) {
					itemsArray = findById(layerRoot.groups, parentId).items;
				}
				itemsArray.splice(newPosition, 0, group);

				bus.send('layers-set-root', layerRoot);
			}
		},
		moveLayer: function(layerId, parentId, newPosition) {
			var group = layerRoot.groups.filter(function(g) {
				return g.items && g.items.indexOf(layerId) >= 0;
			})[0];

			// delete
			var sourceItemsArray = group.items;
			var sourceIndex = -1;
			for (var i = 0; i < sourceItemsArray.length; i++) {
				if (sourceItemsArray[i] == layerId) {
					sourceIndex = i;
					break;
				}
			}
			if (parentId != group.id || newPosition != sourceIndex) {
				sourceItemsArray.splice(sourceIndex, 1);

				// insert
				var targetGroup = findById(layerRoot.groups, parentId);
				var itemsArray = targetGroup.items;
				itemsArray.splice(newPosition, 0, layerId);

				bus.send('layers-set-root', layerRoot);
			}
		},
		removeGroup: function(id) {
			findAndDeleteGroup(layerRoot.groups, id);
			bus.send('layers-set-root', layerRoot);
		},
		removePortalLayer: function(id) {
			doDeleteLayer(id);
			process(layerRoot.groups, function(group, i) {
				if (group.hasOwnProperty('items')) {
					var index = group.items.indexOf(id);
					if (index != -1) {
						group.items.splice(index, 1);
						return true;
					}
				}

				return false;
			});

			bus.send('layers-set-root', layerRoot);
		},
		getDefaultServer: function() {
			var ret = layerRoot['default-server'];
			if (ret) {
				ret = ret.trim();
				if (ret.indexOf('http://') !== 0) {
					ret = 'http://' + ret;
				}
			}
			return ret;
		},
		get: function() {
			return layerRoot;
		}
	};
});
