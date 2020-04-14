
package org.geoladris.layers;

import static org.junit.Assert.assertEquals;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.geoladris.layers.Output;
import org.geoladris.layers.Outputs;
import org.junit.Test;

public class OutputTest {

  @Test
  public void testSerialization() throws Exception {
    Outputs indicators =
        new Outputs(new Output("schema", 1, "1", "id field", "name field", "output_title"));

    ObjectMapper mapper = new ObjectMapper();
    JsonNode tree = mapper.readTree(indicators.toJSON());
    assertEquals(1, tree.size());
    JsonNode indicatorNode = tree.get(0);
    assertEquals("1", indicatorNode.get("id").asText());
    assertEquals("id field", indicatorNode.get("idField").asText());
    assertEquals("name field", indicatorNode.get("nameField").asText());
    assertEquals("output_title", indicatorNode.get("title").asText());
    assertEquals(4, indicatorNode.size());
  }
}
