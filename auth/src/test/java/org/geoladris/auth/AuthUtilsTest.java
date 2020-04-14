package org.geoladris.auth;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.junit.Test;

public class AuthUtilsTest {
  @Test
  public void missingRoles() throws Exception {
    HttpServletRequest request = mockRequestWithRoles(null);
    assertFalse(Auth.isAuthorized(request));
  }

  @Test
  public void notAuthorisedRole() throws Exception {
    String role = "admin";
    HttpServletRequest request = mockRequestWithRoles(role);
    when(request.isUserInRole(role)).thenReturn(false);
    assertFalse(Auth.isAuthorized(request));
  }

  @Test
  public void authorisedRole() throws Exception {
    String role = "admin";
    HttpServletRequest request = mockRequestWithRoles(role);
    when(request.isUserInRole(role)).thenReturn(true);
    assertTrue(Auth.isAuthorized(request));
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
    when(request.getServletContext()).thenReturn(context);
    HttpSession session = mock(HttpSession.class);
    when(session.getServletContext()).thenReturn(context);
    when(request.getSession(anyBoolean())).thenReturn(session);
    when(context.getAttribute(Geoladris.ATTR_CONFIG)).thenReturn(config);

    return request;
  }
}
