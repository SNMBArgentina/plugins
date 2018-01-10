package org.geoladris.auth;

import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Properties;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.junit.Before;
import org.junit.Test;

public class LoginServletTest {
  private static final String ADMIN_ROLE = "admin";

  private LoginServlet servlet;
  private HttpServletRequest request;
  private HttpServletResponse response;
  private HttpSession session;

  @Before
  public void setup() throws ServletException {
    Properties properties = new Properties();
    properties.setProperty(LoginServlet.PROP_AUTHORIZED_ROLES, ADMIN_ROLE);
    Config config = mock(Config.class);
    when(config.getProperties()).thenReturn(properties);

    ServletContext context = mock(ServletContext.class);

    ServletConfig servletConfig = mock(ServletConfig.class);
    when(servletConfig.getServletContext()).thenReturn(context);

    servlet = new LoginServlet();
    servlet.init(servletConfig);

    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);

    session = mock(HttpSession.class);
    when(request.getSession()).thenReturn(session);
    when(context.getAttribute(Geoladris.ATTR_CONFIG)).thenReturn(config);
  }

  @Test
  public void doesNotAttemptLoginIfCredentialsNotProvided() throws Exception {
    servlet.doPost(request, response);
    verify(request, never()).login(anyString(), anyString());
  }

  @Test
  public void attemptsLoginIfCredentialsProvided() throws Exception {
    String user = "myuser";
    String pass = "mypass";

    when(request.getParameter(LoginServlet.HTTP_PARAM_USER)).thenReturn(user);
    when(request.getParameter(LoginServlet.HTTP_PARAM_PASS)).thenReturn(pass);
    when(request.isUserInRole(anyString())).thenReturn(true);
    servlet.doPost(request, response);

    verify(request, atLeastOnce()).getSession();
    verify(request).login(user, pass);
  }

  @Test
  public void notAuthorised() throws Exception {
    when(request.getParameter(LoginServlet.HTTP_PARAM_USER)).thenReturn("myuser");
    when(request.getParameter(LoginServlet.HTTP_PARAM_PASS)).thenReturn("mypass");

    servlet.doPost(request, response);

    verify(response).sendError(HttpServletResponse.SC_BAD_REQUEST);
    verify(request).logout();
    verify(request.getSession()).invalidate();
  }

  @Test
  public void authorised() throws Exception {
    when(request.getParameter(LoginServlet.HTTP_PARAM_USER)).thenReturn("myuser");
    when(request.getParameter(LoginServlet.HTTP_PARAM_PASS)).thenReturn("mypass");
    when(request.isUserInRole(anyString())).thenReturn(true);

    servlet.doPost(request, response);

    verify(response).sendError(HttpServletResponse.SC_NO_CONTENT);
    verify(session).setAttribute(Geoladris.ATTR_ROLE, ADMIN_ROLE);
  }
}
