
package org.geoladris.layers.bd;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.regex.Pattern;

import org.geoladris.DBUtils;
import org.geoladris.PersistenceException;
import org.geoladris.layers.Layer;
import org.geoladris.layers.NoSuchIndicatorException;
import org.geoladris.layers.Output;
import org.geoladris.layers.Outputs;

/**
 * Concrete implementation of the {@link Layer} interface based on databases
 * 
 * @author manureta
 * 
 */
public class DBLayer implements Layer {
  private static final String DB_RESOURCE_NAME = "geoladris";

  private String qName;
  public Outputs var_outputs;
  public ArrayList<Output> tempoutputs;

  public DBLayer(final String dbSchemaName, String layerName) throws PersistenceException {
    // TODO Auto-generated constructor stub
    String[] workspaceAndName = layerName.split(Pattern.quote(":"));
    if (workspaceAndName.length != 2) {
      throw new IllegalArgumentException(
          "The layer name must have the form workspaceName:layerName");
    }
    this.qName = layerName;

    DBUtils.processConnection(DB_RESOURCE_NAME, new DBUtils.ReturningDBProcessor<Boolean>() {
      @Override
      public Boolean process(Connection connection) throws SQLException {
        boolean ret = false;

        PreparedStatement statement = connection.prepareStatement(
            "select * from " + dbSchemaName + ".redd_stats_charts" + " WHERE layer_name=?");
        statement.setString(1, qName);
        ResultSet resultSet = statement.executeQuery();

        ArrayList<Output> temp = null;
        temp = new ArrayList<Output>();
        while (resultSet.next()) {
          // Cargar los datos para este layer de todos los
          // OutputDescriptors (diferentes graficos)
          int id = resultSet.getInt("id");
          String division_field_id = resultSet.getString("division_field_id");
          String division_field_name = resultSet.getString("division_field_name");
          String title = resultSet.getString("title");
          Output output =
              new Output(dbSchemaName, id, "" + id, division_field_id, division_field_name, title);
          // Ver de agregar estos meta datos al Output.
          output.setSubtitle(resultSet.getString("subtitle"));
          output.setData_table_date_field(resultSet.getString("data_table_date_field"));
          output
              .setData_table_date_field_format(resultSet.getString("data_table_date_field_format"));
          String format = resultSet.getString("data_table_date_field_output_format");
          if (format != null) {
            output.setData_table_date_field_output_format(format);
          }
          output.setData_table_id_field(resultSet.getString("data_table_id_field"));
          output.setTable_name_data(resultSet.getString("table_name_data"));

          temp.add(output);

        }
        var_outputs = new Outputs(temp);
        resultSet.close();
        statement.close();
        connection.close();
        return ret;

      }
    });

  }

  @Override
  public Outputs getOutputs() throws IOException, SQLException {
    // TODO Auto-generated method stub
    /*
     * OutputDescriptor descriptor = new OutputDescriptor(""+this.id, this.name,
     * this.division_field_id); return new Outputs(descriptor);
     */
    return this.var_outputs;
  }

  @Override
  public Output getOutput(String outputId) throws NoSuchIndicatorException {

    // Declaramos el Iterador e imprimimos los Elementos del ArrayList
    Iterator<Output> outputsIterator = this.var_outputs.iterator();
    while (outputsIterator.hasNext()) {
      Output elemento = outputsIterator.next();
      if (elemento.getId().equals(outputId)) {
        return elemento;
      }
    }
    return null;
  }

}
