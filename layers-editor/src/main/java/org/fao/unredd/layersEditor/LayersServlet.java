package org.fao.unredd.layersEditor;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.geoladris.servlet.ClientContentServlet;

@MultipartConfig
public class LayersServlet extends HttpServlet {

  private static Logger logger = Logger.getLogger(ClientContentServlet.class);

  public static final String APPLICATION_JSON = "application/json";
  public static final String UTF_8 = "UTF-8";
  public static final String LAYERS_JSON = "layers.json";

  private static final String BACKUP_FOLDER = "backup";
  private static final long serialVersionUID = 1L;

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    resp.setContentType(APPLICATION_JSON);
    resp.setCharacterEncoding(UTF_8);
    Config config = (Config) req.getAttribute(Geoladris.ATTR_CONFIG);
    String layersTemplate = IOUtils.toString(new File(config.getDir(), LAYERS_JSON).toURI(), UTF_8);

    PrintWriter writer = resp.getWriter();
    writer.write(layersTemplate);
  }

  @Override
  protected void doPut(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {

    Config config = (Config) req.getAttribute(Geoladris.ATTR_CONFIG);
    File backupDir = new File(config.getDir(), BACKUP_FOLDER);
    File layersJSON = new File(config.getDir(), LAYERS_JSON);
    if (layersJSON.exists()) {
      SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd_HH:mm:ss_");
      File layersJSONBack = new File(backupDir, format.format(new Date()).concat(LAYERS_JSON));
      FileUtils.copyFile(layersJSON, layersJSONBack);
      layersJSON.delete();
      layersJSON.createNewFile();
      BufferedReader reader = req.getReader();
      OutputStream out = new FileOutputStream(layersJSON);
      IOUtils.copy(reader, new BufferedOutputStream(out), UTF_8);

      out.close();
      reader.close();

      logger.info("All OK, layers.json updated: 200");
      resp.setStatus(HttpServletResponse.SC_OK);
    } else {
      logger.error("No layers.json file found in PORTAL_CONFIG_DIR");
      resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
          "No layers.json file found in PORTAL_CONFIG_DIR");
    }

  }

}
