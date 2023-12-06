import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js", // Entry point
  output: [
    {
      file: "dist/nestml.bundle.js", // Output file
      format: "umd", // Universal Module Definition
      name: "nestml", // Bundle name
    },
    {
      file: "dist/nestml.bundle.min.js",
      format: "umd",
      name: "version",
      plugins: [terser()],
    },
  ],
  plugins: [
    resolve(), // Locates modules using the Node resolution algorithm, for using third party modules in node_modules
    commonjs(), // Converts CommonJS modules to ES6
  ],
};
