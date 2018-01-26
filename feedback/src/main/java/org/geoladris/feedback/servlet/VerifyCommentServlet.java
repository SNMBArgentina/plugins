package org.geoladris.feedback.servlet;

import java.io.IOException;
import java.util.Locale;
import java.util.ResourceBundle;

import javax.mail.MessagingException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.geoladris.Geoladris;
import org.geoladris.PersistenceException;
import org.geoladris.config.Config;
import org.geoladris.feedback.Feedback;
import org.geoladris.feedback.VerificationCodeNotFoundException;
import org.geoladris.servlet.StatusServletException;

public class VerifyCommentServlet extends HttpServlet {
  private static final long serialVersionUID = 1L;

  private static Logger logger = Logger.getLogger(VerifyCommentServlet.class);

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    Config config = (Config) getServletContext().getAttribute(Geoladris.ATTR_CONFIG);
    Locale locale = (Locale) req.getSession().getAttribute(Geoladris.ATTR_LOCALE);
    ResourceBundle messages = config.getMessages(locale);

    String verificationCode = req.getParameter("verificationCode");

    try {
      Feedback feedback = (Feedback) req.getServletContext().getAttribute("feedback");
      feedback.verify(verificationCode);
      resp.setContentType("text/plain");
      resp.getWriter().println(messages.getString("Feedback.the_message_has_been_validated"));
    } catch (VerificationCodeNotFoundException e) {
      logger.debug("Cannot find verification code", e);
      throw new StatusServletException(404, messages.getString("Feedback.comment_not_found"));
    } catch (PersistenceException e) {
      throw new StatusServletException(500, e);
    } catch (MessagingException e) {
      throw new StatusServletException(500, e);
    }
  }
}
