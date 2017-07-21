/**
 * nfms4redd Portal Interface - http://nfms4redd.org/
 *
 * (C) 2012, FAO Forestry Department (http://www.fao.org/forestry/)
 *
 * This application is free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation; version 3.0 of the
 * License.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 */
package org.fao.unredd.layers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.fao.unredd.DBUtils;
import org.fao.unredd.PersistenceException;

/**
 * One of the outputs a layer can have.
 * 
 * @author manureta
 */
public class Output extends OutputDescriptor {

  private String subtitle;
  private String table_name_data;
  private String data_table_id_field;
  private String data_table_date_field;
  private String data_table_date_field_format;
  private String data_table_date_field_output_format = "DD-MM-YYYY";

  private String dbSchemaName;
  private int chartId;
  private ArrayList<Axis> axes = null;
  private ArrayList<String> dates = null;

  public Output(String dbSchemaName, int chartId, String id, String idField, String nameField,
      String title) {
    super(id, idField, nameField, title);
    this.dbSchemaName = dbSchemaName;
    this.chartId = chartId;
  }

  public ArrayList<Axis> getAxes(String objectId) throws PersistenceException {
    if (this.axes == null) {
      this.cargarDatos(objectId);
    }

    return axes;
  }

  public List<String> getLabels(String objectid) throws PersistenceException {
    if (this.dates == null) {
      this.cargarDatos(objectid);
    }

    return dates;
  }

  public String getSubtitle() {
    return subtitle;
  }

  public void setSubtitle(String subtitle) {
    this.subtitle = subtitle;
  }

  public void setData_table_date_field(String data_table_date_field) {
    this.data_table_date_field = data_table_date_field;
  }

  public void setData_table_date_field_format(String data_table_date_field_format) {
    this.data_table_date_field_format = data_table_date_field_format;
  }

  public void setData_table_date_field_output_format(String data_table_date_field_output_format) {
    if (data_table_date_field_output_format == null) {
      throw new IllegalArgumentException("format cannot be null");
    }
    this.data_table_date_field_output_format = data_table_date_field_output_format;
  }

  public void setData_table_id_field(String data_table_id_field) {
    this.data_table_id_field = data_table_id_field;
  }

  public void setTable_name_data(String table_name_data) {
    this.table_name_data = table_name_data;
  }

  private void cargarDatos(final String objectid) throws PersistenceException {
    DBUtils.processConnection("unredd-portal", new DBUtils.DBProcessor() {

      @Override
      public void process(Connection connection) throws SQLException {
        dates = new ArrayList<String>();
        axes = new ArrayList<Axis>();
        PreparedStatement statement = connection.prepareStatement("SELECT * FROM " + dbSchemaName
            + ".redd_stats_variables WHERE chart_id=? ORDER BY priority DESC");
        statement.setInt(1, chartId);
        ResultSet resultSet = statement.executeQuery();
        HashMap<String, Series> fieldSeries = new HashMap<String, Series>();
        boolean opposite = false;
        while (resultSet.next()) {
          String axisLabel = resultSet.getString("y_label");
          String units = resultSet.getString("units");
          String graphicType = resultSet.getString("graphic_type");
          Axis axis = findAxis(axisLabel, units, graphicType);
          if (axis == null) {
            axis = new Axis();
            axis.setLabel(axisLabel);
            axis.setUnits(units);
            axis.setOpposite(opposite = !opposite);
            axis.setType(graphicType);
            axes.add(axis);
          }
          Series serie = axis.addSerie(resultSet.getString("variable_name"));
          String variableField = resultSet.getString("data_table_variable_field");

          fieldSeries.put(variableField, serie);
        }
        resultSet.close();
        statement.close();

        // Build a date expression to sort by
        String dateExpression = "\"" + data_table_date_field + "\"";
        if (data_table_date_field_format != null) {
          dateExpression =
              "to_date(" + dateExpression + "::varchar, '" + data_table_date_field_format + "')";
        }

        // Build the output string we'll put in the template
        String dateField = "to_char(" + dateExpression + ", '" + data_table_date_field_output_format
            + "') as " + data_table_date_field;

        String sql = "SELECT " + dateField;
        for (String variableName : fieldSeries.keySet()) {
          sql += ", \"" + variableName + "\" ";
        }
        sql += " FROM " + table_name_data + " WHERE \"" + data_table_id_field
            + "\"::varchar in (?, trim(leading '0' from ?)) " + "ORDER BY " + dateExpression;
        statement = connection.prepareStatement(sql);
        statement.setString(1, objectid);
        statement.setString(2, objectid);
        resultSet = statement.executeQuery();

        while (resultSet.next()) {
          dates.add(resultSet.getString(data_table_date_field));
          for (String variableName : fieldSeries.keySet()) {
            Series series = fieldSeries.get(variableName);
            float value = resultSet.getFloat(variableName);
            if (resultSet.wasNull()) {
              series.addValue(null);
            } else {
              series.addValue(value);
            }
          }
        }
        resultSet.close();
        statement.close();
        connection.close();

      }

      private Axis findAxis(String axisLabel, String units, String graphicType) {
        for (Axis axis : axes) {
          if (axis.getLabel().equals(axisLabel) && axis.getType().equals(graphicType)
              && axis.getUnits().equals(units)) {
            return axis;
          }
        }

        return null;
      }

    });

    if (dates.isEmpty()) {
      throw new PersistenceException("No results for id " + objectid, null);
    }

  }
}
