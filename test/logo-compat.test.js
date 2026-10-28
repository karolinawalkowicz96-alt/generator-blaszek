import test from 'node:test';
import assert from 'node:assert/strict';
import {readLogoBuffer,loadLogoImage} from '../assets/logo-compat.js';

test('PDF bytes are read through FileReader when Blob.arrayBuffer is absent',async()=>{
  const bytes=new Uint8Array([37,80,68,70]).buffer;
  const Original=globalThis.FileReader;
  try{
    globalThis.FileReader=class {readAsArrayBuffer(file){assert.equal(file.name,'logo.pdf');this.result=bytes;queueMicrotask(()=>this.onload())}};
    assert.equal(await readLogoBuffer({name:'logo.pdf'}),bytes);
    globalThis.FileReader=class {readAsArrayBuffer(){this.error=Error('unreadable');queueMicrotask(()=>this.onerror())}};
    await assert.rejects(readLogoBuffer({}),/unreadable/);
  }finally{globalThis.FileReader=Original}
});
test('modern file reader keeps the same bytes',async()=>{
  const bytes=new Uint8Array([37,80,68,70]).buffer;
  assert.equal(await readLogoBuffer({arrayBuffer:async()=>bytes}),bytes);
});
test('logo image loads without Image.decode and rejects broken images',async()=>{
  const Original=globalThis.Image;
  try{
    globalThis.Image=class {set src(value){queueMicrotask(()=>value==='valid'?this.onload():this.onerror())}};
    assert.ok(await loadLogoImage('valid'));
    await assert.rejects(loadLogoImage('invalid'),/obrazu/);
  }finally{globalThis.Image=Original}
});
