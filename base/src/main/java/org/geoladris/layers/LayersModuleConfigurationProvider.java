package org.geoladris.layers;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.IOUtils;
import org.geoladris.config.Config;
import org.geoladris.config.PluginConfigProvider;

import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class LayersModuleConfigurationProvider implements PluginConfigProvider {
  private static final String PLUGIN_NAME = "base";

  @Override
  public Map<String, JSONObject> getPluginConfig(Config config,
      Map<String, JSONObject> currentConfig, HttpServletRequest request) throws IOException {
    // We create return a pseudo-plugin descriptor containing all the
    // configuration to override/merge
    // The modules, stylesheets and RequireJS data is empty since it is
    // taken from all the other real plugins.
    JSONObject conf = new JSONObject();

    String id = request.getParameter("mapId");
    if (id == null) {
      id = "";
    }
    String layersTemplate =
        IOUtils.toString(new File(config.getDir(), "layers" + id + ".json").toURI(), "UTF-8");
    JSONObject content = (JSONObject) JSONSerializer.toJSON(config.localize(layersTemplate));
    conf.put("layers", content);
    return Collections.singletonMap(PLUGIN_NAME, conf);
  }

  @Override
  public boolean canBeCached() {
    return true;
  }
}
