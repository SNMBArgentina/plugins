package org.fao.unredd.feedback;

public class CannotSendMailException extends Exception {

  private static final long serialVersionUID = 1L;

  public CannotSendMailException(Exception e) {
    super(e);
  }

}
