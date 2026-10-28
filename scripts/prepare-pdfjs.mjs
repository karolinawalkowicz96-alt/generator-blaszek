import {cp,mkdir,rm} from 'node:fs/promises';
import {build} from 'esbuild';
const source=new URL('../node_modules/pdfjs-dist/',import.meta.url);
const target=new URL('../assets/pdfjs/',import.meta.url);
await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true});
// Legacy supplies runtime polyfills in BOTH the page and worker. Lower syntax
// too: legacy alone still contains syntax unsupported by older Safari/Chromium.
for(const name of ['pdf','pdf.worker'])await build({
  stdin:{contents:`import 'core-js/actual/index.js'; export * from 'pdfjs-dist/legacy/build/${name}.mjs';`,resolveDir:new URL('../',import.meta.url).pathname},
  outfile:new URL(`build/${name}.min.mjs`,target).pathname,
  bundle:true,format:'esm',target:['chrome80','firefox78','safari14'],minify:true,
});
for(const path of ['cmaps','standard_fonts','wasm','LICENSE'])await cp(new URL(path,source),new URL(path,target),{recursive:true});
await cp(new URL('../node_modules/dialog-polyfill/dist/',import.meta.url),new URL('dialog/',target),{recursive:true});
