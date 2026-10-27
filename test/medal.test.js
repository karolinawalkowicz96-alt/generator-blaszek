import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8').split('/* ---------- step 1: cards ---------- */')[0];
const context=vm.createContext({document:{getElementById:()=>null},console});
vm.runInContext(source+`;measurer={size:1,setFont(){},setFontSize(s){this.size=s},getTextWidth(t){return Array.from(t).length*this.size*PT*.6}};globalThis.api={mk,fit,fitArcs,centerLogoBox};`,context);
const {mk,fit,fitArcs,centerLogoBox}=context.api;
test('both arcs remain centered and shrink to fit all medal sizes',()=>{
  for(const w of [27,41,52])for(const text of ['A','ZA ZASŁUGI','ĄĆĘŁŃÓŚŹŻ '.repeat(30)]){
    const p=mk({shape:'medal',w,arcTop:{text},arcBottom:{text},lines:[]});fitArcs(p);
    assert.ok(p.centerDiameter>0);
    for(const key of ['arcTop','arcBottom']){
      const glyphs=p.arcGlyphs.filter(g=>g.key===key);
      assert.ok(Math.abs(glyphs[0].dx+glyphs.at(-1).dx)<1e-8);
      for(const g of glyphs){assert.ok(g.size>0);assert.ok(Math.hypot(g.dx,g.dy)<w/2-2)}
    }
  }
});
test('center logo stays inside the reserved area and survives copying',()=>{
  const p=mk({shape:'medal',w:41,centerMode:'logo',centerLogo:{data:'data:image/png;base64,AAAA',w:1000,h:1000,r:500},arcTop:{text:'ZASŁUGI'},lines:[{text:'Zachowany tekst'}]});
  const copy=mk(JSON.parse(JSON.stringify(p)));assert.equal(copy.centerLogo.data,p.centerLogo.data);assert.equal(copy.lines[0].text,'Zachowany tekst');
  fit(copy,{});copy.x=copy.y=7;const box=centerLogoBox(copy);assert.equal(box.w,copy.centerDiameter);assert.ok(box.w<copy.w-4);assert.equal(copy.vis.length,0);
});
test('center text remains inside the circle reserved between the arcs',()=>{
  const p=mk({shape:'medal',w:27,arcTop:{text:'MEDAL'},arcBottom:{text:'ZA ZASŁUGI'},lines:[{text:'DLA'},{text:'Długi tekst w środku'}]});fit(p,{});
  assert.equal(p.vis.length,2);
  const top=(p.w-p.centerDiameter)/2;
  for(const l of p.vis){assert.ok(l.offsetY>=top);assert.ok(l.offsetY<p.w-top)}
});
