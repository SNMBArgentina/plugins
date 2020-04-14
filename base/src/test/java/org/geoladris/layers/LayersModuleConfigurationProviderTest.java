package org.geoladris.layers;

import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.FileUtils;
import org.geoladris.config.Config;
import org.geoladris.layers.LayersModuleConfigurationProvider;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import net.sf.json.JSONObject;

public class LayersModuleConfigurationProviderTest {
  private LayersModuleConfigurationProvider provider;
  private File confDir;
  private Config config;
  private HttpServletRequest request;

  @Before
  public void setup() throws IOException {
    this.provider = new LayersModuleConfigurationProvider();
    this.confDir = File.createTempFile("geoladris_base", "");
    this.confDir.delete();
    this.confDir.mkdir();

    this.config = mock(Config.class);
    when(config.getDir()).thenReturn(confDir);
    this.request = mock(HttpServletRequest.class);
  }

  @After
  public void teardown() throws IOException {
    FileUtils.deleteDirectory(this.confDir);
  }

  @Test
  public void testGetPluginConf() throws Exception {
    when(config.localize(anyString())).thenReturn("{}");
    new File(this.confDir, "layers.json").createNewFile();

    Map<String, JSONObject> pluginConfig =
        provider.getPluginConfig(this.config, new HashMap<String, JSONObject>(), request);

    assertEquals(1, pluginConfig.size());
    JSONObject pluginConf = pluginConfig.values().iterator().next();
    assertEquals(JSONObject.fromObject("{layers:{}}"), pluginConf);
  }
}
