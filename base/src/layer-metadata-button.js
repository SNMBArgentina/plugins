define([ 'message-bus', 'customization', 'ui/ui' ], function(bus, customization, ui) {

  let idLinkMetadata = {};

  function getMetadataLink(obj) {
    if (obj.hasOwnProperty('metadataLink') && obj.metadataLink !== "") {
      return obj.metadataLink;
    }
    return null;
  }

  let buildButton = function(id, eventName) {
    let link = ui.create('button', {
      id: 'layer_metadata_button_' + id,
      css: 'layer_metadata_button',
      clickEventCallback: function() {
        bus.send(eventName, [ id ]);
      }
    });
    return $(link);
  };

  bus.listen('reset-layers', () => {
    idLinkMetadata = {};
  });

  bus.listen('before-adding-layers', () => {
    let showMetadataLayerAction = (portalLayer) => {
      if (getMetadataLink(portalLayer) != null) {
        return buildButton(portalLayer.id, 'show-layer-metadata');
      }
      return null
    };

    bus.send("register-layer-action", showMetadataLayerAction);
  });

  bus.listen('add-layer', function(event, layerInfo) {
    if (getMetadataLink(layerInfo) != null) {
      idLinkMetadata['layer-' + layerInfo.id] = {
        'link': getMetadataLink(layerInfo),
        'title': layerInfo.label
      };
    }
  });

  let showInfo = function(id) {
    if (idLinkMetadata.hasOwnProperty(id)) {
      let linkInfo = idLinkMetadata[id];
      bus.send('show-info', [ linkInfo.title, linkInfo.link ]);
    }
  };

  bus.listen('show-layer-metadata', function(event, layerId) {
    showInfo('layer-' + layerId);
  });
});