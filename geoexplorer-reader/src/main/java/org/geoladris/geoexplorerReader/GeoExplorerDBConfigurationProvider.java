package org.geoladris.geoexplorerReader;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.geoladris.DBUtils;
import org.geoladris.PersistenceException;
import org.geoladris.config.Config;
import org.geoladris.config.ConfigException;
import org.geoladris.config.PluginConfigProvider;

import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class GeoExplorerDBConfigurationProvider implements PluginConfigProvider {
  private static final String PLUGIN_NAME = "geoexplorer-reader";

  public GeoExplorerDBConfigurationProvider() {}

  @Override
  public Map<String, JSONObject> getPluginConfig(Config config,
      Map<String, JSONObject> currentConfig, HttpServletRequest request) throws IOException {
    JSONObject conf = new JSONObject();
    conf.put("geoexplorer-layers", getGeoExplorerLayers(request));
    return Collections.singletonMap(PLUGIN_NAME, conf);
  }

  private JSON getGeoExplorerLayers(HttpServletRequest request) {
    try {
      String mapIdParameter = request.getParameter("mapId");
      int mapId;
      if (mapIdParameter != null) {
        try {
          mapId = Integer.parseInt(mapIdParameter);
        } catch (NumberFormatException e) {
          throw new ConfigException("mapId must be an integer");
        }
      } else {
        throw new ConfigException("mapId parameter must be configured");
      }
      return getGeoExplorerLayers(mapId);
    } catch (PersistenceException e) {
      throw new ConfigException("Cannot read geoexplorer database", e);
    }
  }

  private JSON getGeoExplorerLayers(final int mapId) throws PersistenceException {
    String config =
        DBUtils.processConnection("geoexplorer", new DBUtils.ReturningDBProcessor<String>() {

          @Override
          public String process(Connection connection) throws SQLException {
            PreparedStatement statement =
                connection.prepareStatement("select config from maps where id=?");
            statement.setInt(1, mapId);
            ResultSet rs = statement.executeQuery();
            if (rs.next()) {
              return rs.getString(1);
            } else {
              return null;
            }
          }
        });

    return JSONSerializer.toJSON(config);
  }

  @Override
  public boolean canBeCached() {
    return false;
  }

}
