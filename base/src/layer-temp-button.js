define([ 'message-bus', 'customization', 'ui/ui' ], function(bus, customization, ui) {

  let idLinkTemp = {};

  function getTempLink(obj) {
    if (obj.tempFile) {
      return 'static/loc/' + customization.languageCode + '/html/' + obj.tempFile;
    }
    return null;
  }

  let buildButton = function(id, eventName) {
    let link = ui.create('button', {
      id: 'layer_temp_button_' + id,
      css: 'layer_temp_button layer_action_button',
      clickEventCallback: function() {
        bus.send(eventName, [ id ]);
      }
    });
    return $(link);
  };

  bus.listen('reset-layers', () => {
    idLinkTemp = {};
  });

  bus.listen('before-adding-layers', () => {
    let showTempLayerAction = (portalLayer) => {
      if (getTempLink(portalLayer) != null) {
        return buildButton(portalLayer.id, 'show-layer-temp');
      }
      return null
    };

    bus.send("register-layer-action", showTempLayerAction);
  });

  bus.listen('add-layer', function(event, layerInfo) {
    if (getTempLink(layerInfo) != null) {
      idLinkTemp['layer-' + layerInfo.id] = {
        'link': getTempLink(layerInfo),
        'title': layerInfo.label
      };
    }
  });

  let showInfo = function(id) {
    if (idLinkTemp.hasOwnProperty(id)) {
      let linkInfo = idLinkTemp[id];
      bus.send('show-info', [ linkInfo.title, linkInfo.link ]);
    }
  };

  bus.listen('show-layer-temp', function(event, layerId) {
    showInfo('layer-' + layerId);
  });
});