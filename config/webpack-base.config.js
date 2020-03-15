const CST = require("./WP_CST");

const webpack = require("webpack"),
  htmlPlugin = require("html-webpack-plugin"),
  { CleanWebpackPlugin } = require("clean-webpack-plugin"),
  { InjectManifest } = require("workbox-webpack-plugin");

module.exports = {
  entry: {
    app: `./${CST.PUBLIC_FOLDER}/game/js/main`
  },
  output: {
    path: CST.PUBLIC_PATH + "/build",
    filename: CST.OUTPUT_FILENAME
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx"]
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        include: CST.PUBLIC_PATH
        /*use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/env']
              }
            }*/
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new htmlPlugin({
      template: CST.PUBLIC_PATH + CST.INDEX_TEMPLATE_PATH,
      filename: "../index.html"
    }),
    new webpack.DefinePlugin({
      WEBGL_RENDERER: true,
      CANVAS_RENDERER: true
    }),
    new webpack.DefinePlugin({
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true)
    }),
    // generate a manifest for file precaching
    new InjectManifest({
      swSrc: CST.PUBLIC_PATH + CST.SERVICE_WORKER_SRC,
      swDest: CST.SERVICE_WORKER_DEST,
      // let the max size up to 10mb
      maximumFileSizeToCacheInBytes: CST.CACHE_SIZE,
      manifestTransforms: [CST.APPEND_BUILD_DIR],
      additionalManifestEntries: [
        //{ url: "./game/css/game.css", revision: "foo" }
      ]
    })
  ]
};
