const path = require("path");

let CST = {
  PUBLIC_FOLDER: "public",
  SERVICE_WORKER_SRC: "/game/js/service-worker.js",
  INDEX_TEMPLATE_PATH: "/index_template.html",
  OUTPUT_FILENAME: "app.bundle.js",
  CACHE_SIZE: 10 * 1024 * 1024,
  // extra assets
  GLOB_DIRECTORY: "./game/"
};

/* eslint-disable no-undef */
CST.PUBLIC_PATH = path.resolve(__dirname, `../${CST.PUBLIC_FOLDER}`);
CST.SERVICE_WORKER_DEST = `${CST.PUBLIC_PATH}/sw-build.js`;

// append "build" to evert file cached by the service worker
CST.APPEND_BUILD_DIR = async manifestEntries => {
  const manifest = manifestEntries.map(entry => {
    const buildDir = "/build/";
    entry.url = buildDir + entry.url;

    return entry;
  });

  return { manifest, warnings: [] };
};

module.exports = CST;
