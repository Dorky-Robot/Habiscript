const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");

module.exports = {
  input: "src/index.js",
  output: [
    {
      file: "dist/habiscript.bundle.js",
      format: "umd",
      name: "Habiscript",
    },
    {
      file: "dist/habiscript.bundle.min.js",
      format: "umd",
      name: "Habiscript",
      plugins: [
        terser({}),
      ],
    },
    {
      file: "dist/habiscript.esm.js",
      format: "es",
      name: "Habiscript",
    },
    // Minified ES module format
    {
      file: "dist/habiscript.esm.min.js",
      format: "es",
      name: "Habiscript",
      plugins: [
        terser(),
      ],
    }
  ],
  plugins: [resolve(), commonjs()],
};
