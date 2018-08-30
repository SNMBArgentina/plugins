package org.geoladris.auth;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.geoladris.auth.LogoutServlet;
import org.junit.Before;
import org.junit.Test;

public class LogoutServletTest {
  private LogoutServlet servlet;
  private HttpSession session;
  private HttpServletRequest request;
  private HttpServletResponse response;

  @Before
  public void setup() {
    servlet = new LogoutServlet();

    session = mock(HttpSession.class);
    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);

    when(request.getSession()).thenReturn(session);
  }

  @Test
  public void doesLogout() throws Exception {
    servlet.doGet(request, response);
    verify(request).logout();
  }

  @Test
  public void invalidatesSession() throws Exception {
    servlet.doGet(request, response);
    verify(session).invalidate();
  }

  @Test
  public void sendsNoContent() throws Exception {
    servlet.doGet(request, response);
    verify(response).sendError(HttpServletResponse.SC_NO_CONTENT);
  }
}
