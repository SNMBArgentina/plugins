
package org.geoladris.charts;

import java.io.IOException;
import java.io.StringWriter;

import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;
import org.apache.velocity.runtime.RuntimeConstants;
import org.geoladris.PersistenceException;
import org.geoladris.layers.Output;

/**
 * 
 * @author manureta
 */
public class ChartGenerator {

  private Output inputData;

  public ChartGenerator(Output output) {
    inputData = output;
  }

  public String generate(String objectId, String objectName)
      throws IOException, PersistenceException {
    VelocityEngine engine = new VelocityEngine();
    engine.setProperty("resource.loader", "class");
    engine.setProperty(RuntimeConstants.RUNTIME_LOG_LOGSYSTEM_CLASS,
        "org.apache.velocity.runtime.log.Log4JLogChute" );
    engine.setProperty("runtime.log.logsystem.log4j.logger", 
        ChartGenerator.class.getCanonicalName());
    engine.setProperty("class.resource.loader.class",
        "org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader");
    engine.init();
    VelocityContext context = new VelocityContext();

    context.put("title", nullToEmptyString(inputData.getTitle()) + ": " + objectName);
    context.put("subtitle", nullToEmptyString(inputData.getSubtitle()));

    context.put("dates", inputData.getLabels(objectId));
    context.put("axes", inputData.getAxes(objectId));

    String template = "/org/geoladris/charts/highcharts-template.vtl";
    Template t = engine.getTemplate(template);

    StringWriter writer = new StringWriter();
    t.merge(context, writer);
    writer.flush();
    return writer.getBuffer().toString();
  }

  private Object nullToEmptyString(Object value) {
    return value == null ? "" : value;
  }

  public String getContentType() {
    return "application/json;charset=UTF-8";
  }

}
