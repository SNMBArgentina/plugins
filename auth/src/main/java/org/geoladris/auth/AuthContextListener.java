package org.geoladris.auth;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;

public class AuthContextListener implements ServletContextListener {

  @Override
  public void contextInitialized(ServletContextEvent event) {
    Config config = (Config) event.getServletContext().getAttribute(Geoladris.ATTR_CONFIG);
    config.addPluginConfigProvider(new AuthConfigurationProvider());
  }

  @Override
  public void contextDestroyed(ServletContextEvent event) {
    // do nothing
  }
}
