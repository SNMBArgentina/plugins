package org.geoladris.feedback;

import org.geoladris.PersistenceException;

public interface FeedbackPersistence {

  void insert(String geom, String srid, String comment, String email, String layerName,
      String layerDate, String verificationCode, String language) throws PersistenceException;

  void cleanOutOfDate() throws PersistenceException;

  boolean existsUnverified(String verificationCode) throws PersistenceException;

  void verify(String verificationCode) throws PersistenceException;

  CommentInfo[] getValidatedToNotifyInfo() throws PersistenceException;

  void setNotified(int id) throws PersistenceException;

}
