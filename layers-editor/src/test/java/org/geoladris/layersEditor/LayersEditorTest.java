
package org.geoladris.layersEditor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.URL;
import java.util.Iterator;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.geoladris.Geoladris;
import org.geoladris.config.Config;
import org.geoladris.layersEditor.LayersServlet;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

/**
 * @author michogarcia
 *
 */
public class LayersEditorTest {

  private static final boolean APPEND = true;
  private LayersServlet servlet;
  private Config defaultconfig;
  private HttpServletRequest request;

  @Rule
  public TemporaryFolder testFolder = new TemporaryFolder();

  /**
   * @throws java.lang.Exception
   */
  @Before
  public void setUp() throws Exception {
    servlet = new LayersServlet();
    ServletConfig config = mock(ServletConfig.class);
    servlet.init(config);
    defaultconfig = mock(Config.class);
    ServletContext context = mock(ServletContext.class);
    when(config.getServletContext()).thenReturn(context);
    request = mock(HttpServletRequest.class);
    when(context.getAttribute(Geoladris.ATTR_CONFIG)).thenReturn(defaultconfig);
    when(request.getServletContext()).thenReturn(context);
  }

  /**
   * Test method for
   * {@link org.geoladris.layersEditor.LayersServlet#doPut(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)}.
   * 
   * @throws IOException
   * @throws ServletException
   */
  @Test
  public void testDoPutHttpServletRequestHttpServletResponse()
      throws ServletException, IOException {

    HttpServletResponse resp = mock(HttpServletResponse.class);

    File tmpDir = testFolder.getRoot();
    tmpDir = new File("/tmp");

    when(defaultconfig.getDir()).thenReturn(tmpDir);

    URL url = this.getClass().getResource("/layers.json");
    File layersJSON = new File(url.getFile());

    FileUtils.copyFileToDirectory(layersJSON, tmpDir);

    File layersJSONCopy = new File(tmpDir, "layers.json");
    FileUtils.writeStringToFile(layersJSONCopy, "dirty", APPEND);

    BufferedReader readerLayers = new BufferedReader(new FileReader(layersJSON));
    when(request.getReader()).thenReturn(readerLayers);

    servlet.doPut(request, resp);

    File backupFolder = new File(tmpDir, "backup");
    InputStream afterPutBackupIs = null;
    Iterator<File> allFilesInBackup = FileUtils.iterateFiles(backupFolder, null, false);
    while (allFilesInBackup.hasNext()) {
      File aFileInFolder = allFilesInBackup.next();
      afterPutBackupIs = new FileInputStream(aFileInFolder);
    }
    InputStream originalLayerJSONIs = new FileInputStream(new File(url.getFile()));
    InputStream afterPutLayersIs = new FileInputStream(new File(tmpDir, "layers.json"));
    boolean equals = IOUtils.contentEquals(afterPutLayersIs, originalLayerJSONIs);
    assertTrue(equals);

    InputStream againOriginalLayerJSONIs = new FileInputStream(new File(url.getFile()));
    equals = IOUtils.contentEquals(afterPutBackupIs, againOriginalLayerJSONIs);
    assertFalse(equals);
  }

  @Test
  public void returnsErrorIfNoLayersJSON() throws Exception {
    HttpServletResponse resp = mock(HttpServletResponse.class);

    when(defaultconfig.getDir()).thenReturn(testFolder.getRoot());

    InputStreamReader input = new InputStreamReader(getClass().getResourceAsStream("/layers.json"));
    BufferedReader readerLayers = new BufferedReader(input);
    when(request.getReader()).thenReturn(readerLayers);

    servlet.doPut(request, resp);

    verify(resp).sendError(eq(HttpServletResponse.SC_INTERNAL_SERVER_ERROR), anyString());
  }

  @Test
  public void doGet() throws Exception {
    HttpServletResponse resp = mock(HttpServletResponse.class);

    ByteArrayOutputStream bos = new ByteArrayOutputStream();
    PrintWriter writer = new PrintWriter(bos);
    when(resp.getWriter()).thenReturn(writer);

    when(defaultconfig.getDir()).thenReturn(testFolder.getRoot());
    File file = testFolder.newFile(LayersServlet.LAYERS_JSON);
    IOUtils.copy(getClass().getResourceAsStream("/layers.json"), new FileOutputStream(file));
    servlet.doGet(request, resp);

    writer.flush();

    verify(resp).setContentType(LayersServlet.APPLICATION_JSON);
    verify(resp).setCharacterEncoding(LayersServlet.UTF_8);
    String original = IOUtils.toString(getClass().getResourceAsStream("/layers.json"));
    assertEquals(original, bos.toString());
  }
}
