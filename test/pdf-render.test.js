import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
test('PDF renders correct pixels with missing modern APIs and worker fallback',async()=>{
const root=new URL('../',import.meta.url).pathname;
const require=createRequire(root+'node_modules/pdfjs-dist/package.json');
const {createCanvas}=require('@napi-rs/canvas');
const ctx={exports:{},module:{exports:{}}};ctx.exports=ctx.module.exports;vm.runInNewContext(readFileSync(root+'assets/jspdf.umd.min.js','utf8'),{...ctx,console,atob,btoa,global:{console,atob,btoa}});
const {jsPDF}=ctx.exports;const doc=new jsPDF({unit:'pt',format:[100,100]});doc.setFillColor(255,0,0);doc.rect(0,0,100,100,'F');doc.addPage();doc.setFillColor(0,0,255);doc.rect(0,0,100,100,'F');
Promise.withResolvers=undefined;Promise.try=undefined;Map.prototype.getOrInsertComputed=undefined;globalThis.structuredClone=undefined;
const pdfjs=await import(root+'assets/pdfjs/build/pdf.min.mjs');
pdfjs.GlobalWorkerOptions.workerSrc=root+'assets/pdfjs/build/pdf.worker.min.mjs';
const task=pdfjs.getDocument({data:new Uint8Array(doc.output('arraybuffer')),isEvalSupported:false,isOffscreenCanvasSupported:false,isImageDecoderSupported:false});
const pdf=await task.promise;assert.equal(pdf.numPages,2);
for(let n=1;n<=2;n++){const page=await pdf.getPage(n);const viewport=page.getViewport({scale:1});const canvas=createCanvas(viewport.width,viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const rgba=Array.from(canvas.getContext('2d').getImageData(50,50,1,1).data);assert.deepEqual(rgba,n===1?[255,0,0,255]:[0,0,255,255]);page.cleanup();}
await task.destroy();});
