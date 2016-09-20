package org.fao.unredd.feedback;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;

import org.geoladris.DBUtils;
import org.geoladris.PersistenceException;

public class DBFeedbackPersistence implements FeedbackPersistence {

	public final static int NEW = 0;
	public final static int VERIFIED = 1;
	public final static int VALIDATED = 2;
	public final static int NOTIFIED = 3;

	private String tableName;

	public DBFeedbackPersistence(String schemaName) {
		this.tableName = schemaName + ".redd_feedback";
	}

	@Override
	public void insert(final String geom, final String srid,
			final String comment, final String email, final String layerName,
			final String layerDate, final String verificationCode,
			final String language) throws PersistenceException {
		DBUtils.processConnection("unredd-portal", new DBUtils.DBProcessor() {

			@Override
			public void process(Connection connection) throws SQLException {
				PreparedStatement statement = connection
						.prepareStatement("INSERT INTO "
								+ tableName
								+ "(geometry, comment, date, email, layer_name, "
								+ "layer_date, verification_code, language, state) "
								+ "VALUES"
								+ "(ST_GeomFromText(?, ?), ?, ?, ?, ?, ?, ?, ?, "
								+ NEW + ")");
				statement.setString(1, geom);
				statement.setInt(2, Integer.parseInt(srid));
				statement.setString(3, comment);
				statement.setTimestamp(4, new Timestamp(new Date().getTime()));
				statement.setString(5, email);
				statement.setString(6, layerName);
				statement.setString(7, layerDate);
				statement.setString(8, verificationCode);
				statement.setString(9, language);
				statement.execute();
				statement.close();
			}
		});
	}

	@Override
	public void cleanOutOfDate() throws PersistenceException {
		DBUtils.processConnection("unredd-portal", new DBUtils.DBProcessor() {
			@Override
			public void process(Connection connection) throws SQLException {
				PreparedStatement statement = connection
						.prepareStatement("DELETE FROM "
								+ tableName
								+ " WHERE verification_code IS NOT NULL"
								+ " AND date < (current_timestamp - interval '5 days')");
				statement.execute();

				statement.close();
			}
		});
	}

	@Override
	public boolean existsUnverified(final String verificationCode)
			throws PersistenceException {
		return DBUtils.processConnection("unredd-portal",
				new DBUtils.ReturningDBProcessor<Boolean>() {
					@Override
					public Boolean process(Connection connection)
							throws SQLException {
						PreparedStatement statement = connection
								.prepareStatement("SELECT count(*) FROM "
										+ tableName
										+ " WHERE verification_code = ? AND state = "
										+ NEW);
						statement.setString(1, verificationCode);
						ResultSet resultSet = statement.executeQuery();
						resultSet.next();
						int verificationCodeCount = resultSet.getInt(1);
						statement.close();

						return verificationCodeCount == 1;
					}
				});
	}

	@Override
	public void verify(final String verificationCode)
			throws PersistenceException {
		DBUtils.processConnection("unredd-portal", new DBUtils.DBProcessor() {
			@Override
			public void process(Connection connection) throws SQLException {
				PreparedStatement statement = connection
						.prepareStatement("UPDATE " + tableName
								+ " SET state = " + VERIFIED
								+ " WHERE verification_code = ? AND state = "
								+ NEW);
				statement.setString(1, verificationCode);
				statement.execute();

				statement.close();
			}
		});
	}

	@Override
	public CommentInfo[] getValidatedToNotifyInfo() throws PersistenceException {
		final ArrayList<CommentInfo> ret = new ArrayList<CommentInfo>();
		DBUtils.processConnection("unredd-portal", new DBUtils.DBProcessor() {
			@Override
			public void process(Connection connection) throws SQLException {
				PreparedStatement statement = connection
						.prepareStatement("SELECT id, email, verification_code, language FROM "
								+ tableName + " WHERE state=" + VALIDATED);
				ResultSet result = statement.executeQuery();
				while (result.next()) {
					ret.add(new CommentInfo(result.getInt("id"), result
							.getString("email"), result
							.getString("verification_code"), result
							.getString("language")));
				}
				result.close();
				statement.close();
			}
		});

		return ret.toArray(new CommentInfo[ret.size()]);
	}

	@Override
	public void setNotified(final int id) throws PersistenceException {
		DBUtils.processConnection("unredd-portal", new DBUtils.DBProcessor() {
			@Override
			public void process(Connection connection) throws SQLException {
				PreparedStatement statement = connection
						.prepareStatement("UPDATE " + tableName
								+ " SET state = " + NOTIFIED + " WHERE id = ?");
				statement.setInt(1, id);
				statement.execute();

				statement.close();
			}
		});
	}

}
