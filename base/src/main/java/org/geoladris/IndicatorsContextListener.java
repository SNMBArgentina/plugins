package org.geoladris;

import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.log4j.Logger;
import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.geoladris.layers.bd.DBLayerFactory;

public class IndicatorsContextListener implements ServletContextListener {

  private static final Logger logger = Logger.getLogger(IndicatorsContextListener.class);

  @Override
  public void contextInitialized(ServletContextEvent sce) {
    ServletContext servletContext = sce.getServletContext();
    final Config config = (Config) servletContext.getAttribute(Geoladris.ATTR_CONFIG);
    Properties properties = config.getProperties();
    try {
      DBLayerFactory layerFactory = new DBLayerFactory(properties.getProperty("db-schema"));
      servletContext.setAttribute("layer-factory", layerFactory);
    } catch (NullPointerException e) {
      logger.error(
          "The statistics metadata table name was not configured. Please set the \"indicators-metadata-db-table\" property",
          e);
    }
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {}

}
