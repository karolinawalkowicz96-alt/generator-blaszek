import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8').split('/* ---------- step 1: cards ---------- */')[0];
const context=vm.createContext({document:{getElementById:()=>null},console});
vm.runInContext(source+`;measurer={size:1,setFont(){},setFontSize(s){this.size=s},getTextWidth(t){return Array.from(t).length*this.size*PT*.6}};globalThis.api={mk,fit,fitArcs,centerLogoBox,plateLogoLayout,linePos};`,context);
const {mk,fit,fitArcs,centerLogoBox,plateLogoLayout,linePos}=context.api;
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

const options={padx:4.5,pady:2.5,max:14,lh:1.45};
const logo={data:'data:image/png;base64,AAAA',w:400,h:200};
test('corner logos keep proportions, safe inset and do not overlap fitted text',()=>{
  for(const [w,h] of [[80,25],[100,60],[30,10],[160,100]])for(const sides of [{leftLogo:logo},{rightLogo:logo},{leftLogo:logo,rightLogo:{...logo,w:150,h:400}}]){
    const p=mk({w,h,...sides,lines:[{text:'DLA ZWYCIĘZCY'},{text:'Jan Kowalski'}],footer:'2026'});fit(p,options);p.x=7;p.y=7;
    const layout=plateLogoLayout(p,options);
    assert.equal(layout.boxes.length,Object.keys(sides).length);
    for(const b of layout.boxes){assert.ok(b.x>0&&b.y>0);assert.ok(b.x+b.w<w&&b.y+b.h<h);assert.ok(Math.abs(b.w/b.h-b.logo.w/b.logo.h)<1e-10)}
    for(const l of linePos(p,options)){assert.ok(l.y-p.y-.72*l.size*25.4/72>=layout.textTop-1e-6);assert.ok(l.y-p.y+.22*l.size*25.4/72<=h-options.pady+1e-6)}
    const restored=mk(JSON.parse(JSON.stringify(p)));assert.equal(restored.leftLogo?.data,p.leftLogo?.data);assert.equal(restored.rightLogo?.data,p.rightLogo?.data);
  }
});
test('center slider grows text, leaves arcs alone and stops at the safe circle',()=>{
  for(const w of [27,41,52])for(const arc of ['', 'ZA ZASŁUGI']){
    const source={shape:'medal',w,arcTop:{text:arc},arcBottom:{text:arc},lines:[{text:'DLA'},{text:'JANA'}],footer:'2026'};
    const small=mk({...source,centerScale:.5}),base=mk(source),large=mk({...source,centerScale:2});
    for(const p of [small,base,large])fit(p,options);
    assert.ok(small.vis[0].size<base.vis[0].size);
    assert.ok(large.vis[0].size>base.vis[0].size);
    assert.deepEqual(large.arcGlyphs,base.arcGlyphs);
    const r=(arc?large.centerDiameter:w-4)/2,c=w/2;
    for(const l of large.vis){const top=l.offsetY-.72*l.size*25.4/72,bottom=l.offsetY+.22*l.size*25.4/72;const edge=Math.max(Math.abs(top-c),Math.abs(bottom-c));const width=l.text.length*l.size*25.4/72*.6;assert.ok(Math.hypot(width/2,edge)<=r+1e-6)}
    assert.equal(mk(JSON.parse(JSON.stringify(large))).centerScale,2);
  }
});
