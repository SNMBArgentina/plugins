
package org.geoladris.layers;

/**
 * Describes one of the outputs a layer can have.
 * 
 * @author fergonco
 * @author manureta
 * 
 */
public class OutputDescriptor {

  /**
   * A unique id that is used by the client when requesting a specific output
   */
  private String id;

  /**
   * The field in the wms layer that identifies the object whom this output contains information
   */
  private String idField;

  /**
   * The field in the wms layer that contains the name from the object whom this output contains
   * information
   */
  private String nameField;

  /**
   * The name of the output
   */
  private String title;

  public OutputDescriptor(String id, String idfield, String nameField, String title) {
    super();
    this.id = id;
    this.idField = idfield;
    this.nameField = nameField;
    this.title = title;
  }

  public String toJSON() {
    return "{" + "\"id\":\"" + id + "\"," + //
        "\"title\":\"" + title + "\"," + //
        "\"idField\":\"" + idField + "\"," + //
        "\"nameField\":\"" + nameField + "\"" + "}";
  }

  public String getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

}
