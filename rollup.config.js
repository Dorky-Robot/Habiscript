import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/nestml.bundle.js",
      format: "umd",
      name: "nestml",
    },
    {
      file: "dist/nestml.bundle.min.js",
      format: "umd",
      name: "nestml",
      plugins: [
        terser({}),
      ],
    },
  ],
  plugins: [resolve(), commonjs()],
};
