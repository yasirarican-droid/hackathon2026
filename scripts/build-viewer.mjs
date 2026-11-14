import { build } from "esbuild";

await build({
  entryPoints: ["src/eagle-viewer.js"],
  outfile: "public/vendor/eagle-viewer.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2022"],
  define: { "import.meta.url": "document.baseURI" },
  legalComments: "external",
});
