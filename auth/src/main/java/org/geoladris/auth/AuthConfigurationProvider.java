package org.geoladris.auth;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.geoladris.config.Config;
import org.geoladris.config.PluginConfigProvider;

import net.sf.json.JSONObject;

public class AuthConfigurationProvider implements PluginConfigProvider {
  public static final String MODULE_NAME = "auth-user";

  @Override
  public Map<String, JSONObject> getPluginConfig(Config config,
      Map<String, JSONObject> currentConfig, HttpServletRequest request) throws IOException {
    JSONObject pluginConfig = new JSONObject();
    if (Auth.isAuthorized(request)) {
      String userName = request.getUserPrincipal().getName();
      pluginConfig.put(MODULE_NAME, JSONObject.fromObject("{ user : '" + userName + "'}"));
    }

    return Collections.singletonMap(Auth.PLUGIN_NAME, pluginConfig);
  }

  @Override
  public boolean canBeCached() {
    return false;
  }
}
