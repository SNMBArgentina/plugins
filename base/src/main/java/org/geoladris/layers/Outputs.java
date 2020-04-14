
package org.geoladris.layers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;

/**
 * A collection of {@link OutputDescriptor}s
 * 
 * @author fergonco
 */
public class Outputs extends ArrayList<Output> {
  private static final long serialVersionUID = 1L;

  public Outputs(ArrayList<Output> temp) {
    this.addAll(temp);
  }

  public Outputs(Output... outputs) {
    Collections.addAll(this, outputs);
  }

  public String toJSON() {
    StringBuilder ret = new StringBuilder("[");
    String separator = "";
    Iterator<Output> it = iterator();
    while (it.hasNext()) {
      OutputDescriptor outputDescriptor = it.next();
      ret.append(separator).append(outputDescriptor.toJSON());
      separator = ",";
    }

    return ret.append("]").toString();
  }

}
