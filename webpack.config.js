const path = require("path")

module.exports = {
  entry: "./client/index.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  mode: "development",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  externals: {
    jmuxer: "JMuxer",
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public"),
  },
}
