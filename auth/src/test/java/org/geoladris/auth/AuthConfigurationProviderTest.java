package org.geoladris.auth;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.junit.Before;
import org.junit.Test;

import net.sf.json.JSONObject;

public class AuthConfigurationProviderTest {
  private AuthConfigurationProvider provider;

  @Before
  public void setup() {
    provider = new AuthConfigurationProvider();
  }

  @Test
  public void cannotBeCached() {
    assertFalse(provider.canBeCached());
  }

  @Test
  public void unauthorisedConfig() throws IOException {
    HttpServletRequest request = mockRequestWithRoles("admin");
    when(request.isUserInRole(anyString())).thenReturn(false);
    Map<String, JSONObject> config =
        provider.getPluginConfig(mock(Config.class), new HashMap<String, JSONObject>(), request);
    assertEquals(new JSONObject(), config.get(Auth.PLUGIN_NAME));
  }

  @Test
  public void authorisedConfig() throws IOException {
    HttpServletRequest request = mockRequestWithRoles("admin");
    when(request.isUserInRole(anyString())).thenReturn(true);

    String user = "username";
    Principal principal = mock(Principal.class);
    when(principal.getName()).thenReturn(user);
    when(request.getUserPrincipal()).thenReturn(principal);

    Map<String, JSONObject> config =
        provider.getPluginConfig(mock(Config.class), new HashMap<String, JSONObject>(), request);
    JSONObject pluginConfig = config.get(Auth.PLUGIN_NAME);
    JSONObject moduleConfig = pluginConfig.getJSONObject(AuthConfigurationProvider.MODULE_NAME);
    assertEquals(user, moduleConfig.getString("user"));
  }

  private HttpServletRequest mockRequestWithRoles(String roles) {
    Properties properties = new Properties();
    if (roles != null) {
      properties.setProperty(Auth.PROP_AUTHORIZED_ROLES, roles);
    }

    Config config = mock(Config.class);
    when(config.getProperties()).thenReturn(properties);

    ServletContext context = mock(ServletContext.class);

    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpSession session = mock(HttpSession.class);
    when(session.getServletContext()).thenReturn(context);
    when(request.getSession(anyBoolean())).thenReturn(session);
    when(request.getServletContext()).thenReturn(context);
    when(context.getAttribute(Geoladris.ATTR_CONFIG)).thenReturn(config);

    return request;
  }
}
