define([ 'jquery', 'message-bus', 'customization', 'module' ], function($, bus, customization, module) {

	//variables global
	var defaultServer;
	var layerRoot;
	var original;

	/*
	 * search recursive item in array for Id
	 * @param array: search array
	 * @param id: id of element
	 * @result items result
	 */
	function findById(array, id) {
		var ret = null;
		array.forEach(function f(item) {
			if (item.id == id) {
				ret = item;
			} else if (item.hasOwnProperty('items')) {
				item.items.forEach(f);
			}
		});
		return ret;
	}

	
	
	  
	/*
	 *Generate url of legend for object wmslayer
	 *@param wmsLayer: items wms  
	 */
	
	function getGetLegendGraphicUrl(wmsLayer) {

		var url = wmsLayer.baseUrl;
				
		//if array
		if (url instanceof Array) {
			url = url[0];
		}
		
		//add character ? 
		if (url.indexOf('?') === -1) {
			url = url + '?';
		} else {
			url = url + '$';
		}
		url += 'REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&TRANSPARENT=true&LAYER=';
		url += wmsLayer.wmsName;

		return url;
	}

	
	/*
	 * check if you exists property
	 * @param wmsLayer: array form search
	 * @param propertyName: name of property
	 */
	function checkMandatoryParameter(wmsLayer, propertyName) {
		if (!wmsLayer.hasOwnProperty(propertyName)) {
			//TODO: change i18n
			bus.send('error', propertyName + " mandatory when queryType='wfs', in layer: " + wmsLayer.id);
		}
	}

	/*
	 * process layer for map
	 * @param mapLayer: layer 
	 * @param mapLayers: wmsLayer array
	 * 
	 */
	function processMapLayer(mapLayer, mapLayers) {
		//get zindex
		mapLayer.zIndex = mapLayers.indexOf(mapLayer);
		
		var url;
		//if exist baseUrl 
		if (mapLayer.baseUrl) {
			//if is array
			if (mapLayer.baseUrl instanceof Array) {
				for (var i = 0; i < mapLayer.baseUrl.length; i++) {
					if (mapLayer.baseUrl[i].charAt(0) == '/') {
						mapLayer.baseUrl[i] = defaultServer + mapLayer.baseUrl[i];
					}
				}
				url = mapLayer.baseUrl[0];
			} else {
				//if is string
				if (mapLayer.baseUrl.charAt(0) == '/') {
					mapLayer.baseUrl = defaultServer + mapLayer.baseUrl;
				}
				url = mapLayer.baseUrl;
			}
		}
		//get queryUrl
		if (!mapLayer.queryUrl) {
			mapLayer.queryUrl = url;
		}
		
		//get legend for wms or image
		if (mapLayer.legend) {
			mapLayerType = mapLayer.type || 'wms';
			if (mapLayer.legend == 'auto' && mapLayerType == 'wms') {
				mapLayer.legendURL = getGetLegendGraphicUrl(mapLayer);
			} else {
				mapLayer.legendURL = 'static/loc/' + customization.languageCode + '/images/' + mapLayer.legend;
			}
		}

		// Check info parameters
		if (mapLayer.hasOwnProperty('queryType') && mapLayer.queryType == 'wfs') {
			checkMandatoryParameter(mapLayer, 'queryGeomFieldName');
			checkMandatoryParameter(mapLayer, 'queryFieldNames');
			checkMandatoryParameter(mapLayer, 'queryFieldAliases');
		}
	}

	
	/*
	 * Generate the layers 
	 *@param groupId: id of parent 
	 *@param id: id of layers
	 * 
	 */
	function processPortalLayer(groupId, id) {
		//get the item
		var portalLayer = findById(layerRoot.portalLayers, id);
		//not found item
		if (portalLayer == null) {
			//TODO: change i18n
			bus.send('error', "Portal layer with id '" + id + "' not found");
			return;
		}
		
		//get timestamps for layers
		portalLayer.groupId = groupId;
		if (portalLayer.timeInstances) {
			portalLayer.timestamps = portalLayer.timeInstances.split(',');
		}

		//
		var layerInfoArray = [];
		//check if you have an assigned layer
		if (portalLayer.layers) {
			portalLayer.layers.forEach(function(mapLayerId) {
				//layers search in wmsLayrs array 
				var mapLayer = findById(layerRoot.wmsLayers, mapLayerId);
				//check if existed
				if (mapLayer !== null) {
					//process items for wmslayer  
					processMapLayer(mapLayer, layerRoot.wmsLayers);
					//insert in array maplayer
					layerInfoArray.push(mapLayer);
				} else {
					//TODO: change i18n
					bus.send('error', "Map layer '" + mapLayerIds[j] + "' not found");
				}
			});
		}
		
		//get maplayer for layers
		portalLayer.mapLayers = layerInfoArray;


		//get OWS legend
		//TODO: verificar la carga de json por defecto
		if (portalLayer.inlineLegendUrl == 'auto' || portalLayer.inlineLegendUrl == '' || typeof portalLayer.inlineLegendUrl == 'undefined') {
			var mapLayers = portalLayer.mapLayers;
			mapLayerType = mapLayers[0].type || 'wms';
			if (mapLayers.length > 0 && mapLayerType == 'wms') {
				portalLayer.inlineLegendUrl = getGetLegendGraphicUrl(mapLayers[0]);
			} else {
				portalLayer.inlineLegendUrl = null;
			}
		} else if (portalLayer.inlineLegendUrl.charAt(0) == '/' && defaultServer) {
			portalLayer.inlineLegendUrl = defaultServer + portalLayer.inlineLegendUrl;
		}

		//add layer in the tree
		bus.send('add-layer', portalLayer);
		//activate of layer 
		bus.send('layer-visibility', [ portalLayer.id, portalLayer.active || false ]);
	}

	/*
	 * generate group in method recursive
	 * @param parentID: parent of group 
	 * @param group: data of group
	 */
	function processGroup(parentId, group) {
		group.parentId = parentId;
		//add the group 
		bus.send('add-group', group);
		//go through the sub-items of the groups
		group.items.forEach(function(item) {
			
			if (typeof item === 'object') {
				//generate group children
				processGroup(group.id, item);
			} else {
				//generate layers children
				processPortalLayer(group.id, item);
			}
		});
	}

	/*
	 * reset variables, generate of layers tree and set variable
	 * 
	 */
	function reload() {
		//clean array layers
		bus.send('reset-layers');
		
		//config default server in variable and clean characters
		defaultServer = null;
		if (layerRoot['default-server']) {
			defaultServer = layerRoot['default-server'];
			defaultServer = $.trim(defaultServer);
			if (defaultServer.substring(0, 7) != 'http://') {
				defaultServer = 'http://' + defaultServer;
			}
		}

		//execute all message 
		bus.send('before-adding-layers');
		//load groups
		layerRoot.groups.forEach(function(group) {
			//load layers
			processGroup(null, group);
		});

		// A copy of the original so it is not modified by listeners
		bus.send('layers-loaded', [ JSON.parse(JSON.stringify(original)) ]);
	}

	/*
	 * Generate the layers tree an reset variable
	 * @param root: file json of layers tree
	 */
	
	function setRoot(root) {
		original = root;

		// A copy of the original to add extra properties for add-layer,
		// add-group events
		layerRoot = JSON.parse(JSON.stringify(original));
		reload();
	}
	
	
	////////Event/////

	//after loading all the modules load the layers
	bus.listen('modules-loaded', function() {
		setRoot(module.config());
	});

	//set layers tree from json
	bus.listen('layers-set-root', function(e, root) {
		setRoot(root);
	});
});
