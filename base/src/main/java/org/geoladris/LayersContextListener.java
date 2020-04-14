package org.geoladris;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.geoladris.layers.LayersModuleConfigurationProvider;

public class LayersContextListener implements ServletContextListener {
  @Override
  public void contextInitialized(ServletContextEvent sce) {
    Config config = (Config) sce.getServletContext().getAttribute(Geoladris.ATTR_CONFIG);
    config.addPluginConfigProvider(new LayersModuleConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {}
}
