
package org.geoladris.layers;

import java.io.IOException;
import java.sql.SQLException;

/**
 * Represents the configuration for a layer.
 * 
 * @author fergonco
 * @author manureta
 */
public interface Layer {

  /**
   * Get a list of all the output identifiers in this layer
   * 
   * @return
   * @throws IOException
   * @throws SQLException
   */
  Outputs getOutputs() throws IOException, SQLException;

  /**
   * Get the output content with the specified id
   * 
   * @param outputId
   * @return
   * @throws NoSuchIndicatorException
   */
  Output getOutput(String outputId) throws NoSuchIndicatorException, IOException;

}
