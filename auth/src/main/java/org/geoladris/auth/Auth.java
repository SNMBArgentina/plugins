package org.geoladris.auth;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;

public class Auth {
  public static final String PLUGIN_NAME = "auth";

  public static final String PROP_AUTHORIZED_ROLES = PLUGIN_NAME + ".roles";

  private Auth() {}

  /**
   * Determines whether the request is performed by a user with a role among the authorised roles.
   * Authorised roles come from the {@link Config#getProperties()} properties, using the
   * {@link #PROP_AUTHORIZED_ROLES} key.
   * 
   * @param request The request to evaluate.
   * @return <code>true</code> if the user performing the request has a role among the group of
   *         authorised roles, <code>false</code> otherwise.
   */
  public static boolean isAuthorized(HttpServletRequest request) {
    ServletContext context = request.getSession(true).getServletContext();
    Config config = (Config) context.getAttribute(Geoladris.ATTR_CONFIG);
    String rolesProp = config.getProperties().getProperty(PROP_AUTHORIZED_ROLES);
    String[] roles = rolesProp != null ? rolesProp.split("\\s*,\\s*") : new String[0];

    for (String role : roles) {
      if (request.isUserInRole(role)) {
        return true;
      }
    }

    return false;
  }
}
