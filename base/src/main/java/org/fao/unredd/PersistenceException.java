package org.fao.unredd;

public class PersistenceException extends Exception {

  private static final long serialVersionUID = 1L;

  public PersistenceException(String message, Exception cause) {
    super(message, cause);
  }
}
