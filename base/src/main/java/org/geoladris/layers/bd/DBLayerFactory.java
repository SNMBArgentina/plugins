
package org.geoladris.layers.bd;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.geoladris.DBUtils;
import org.geoladris.PersistenceException;
import org.geoladris.layers.Layer;
import org.geoladris.layers.LayerFactory;

/**
 * Databases based implementation of {@link LayerFactory}
 * 
 * @author manureta
 * 
 */
public class DBLayerFactory implements LayerFactory {
  private static final String DB_RESOURCE_NAME = "geoladris";

  private String schemaName;

  public DBLayerFactory(String schemaName) {
    super();
    this.schemaName = schemaName;
  }

  @Override
  public boolean exists(final String layerName) {
    try {
      return DBUtils.processConnection(DB_RESOURCE_NAME,
          new DBUtils.ReturningDBProcessor<Boolean>() {
            @Override
            public Boolean process(Connection connection) throws SQLException {
              boolean ret = false;

              PreparedStatement statement =
                  connection.prepareStatement("select count(*) count from " + schemaName
                      + ".redd_stats_charts" + " WHERE layer_name=?");
              statement.setString(1, layerName);
              ResultSet resultSet = statement.executeQuery();
              if (resultSet.next()) {
                if (resultSet.getInt("count") > 0) {
                  ret = true;
                }
              } else {
                ret = false;
              }
              resultSet.close();
              statement.close();
              connection.close();
              return ret;

            }
          });
    } catch (PersistenceException e) {
      // TODO Auto-generated catch block
      // TODO if error because not exsist table, create table
      e.printStackTrace();
    }
    return false;
  }

  @Override
  public Layer newLayer(String layerName) {
    // TODO Auto-generated method stub
    Layer nuevaLayer = null;
    try {
      nuevaLayer = new DBLayer(schemaName, layerName);
    } catch (PersistenceException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
    return nuevaLayer;
  }
}
