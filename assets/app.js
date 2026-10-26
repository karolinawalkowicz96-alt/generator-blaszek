/* Generator Blaszek — by Dawid Tokarski */
'use strict';
const PAGE_W=210, PAGE_H=297, PT=25.4/72;
const $=id=>document.getElementById(id);
const num=(v,d)=>{const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:d};
const fmt=n=>String(+(+n).toFixed(2)).replace('.',',');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- czcionki (ładowane w tle, tylko gdy potrzebne) ---------- */
const FONT_DIR='assets/fonts/';
const FONTS={
  sans:{pdf:'Montserrat',css:'MontserratEmb',files:[['normal','montserrat-regular.ttf',400],['bold','montserrat-bold.ttf',700]]},
  serif:{pdf:'LiberationSerif',css:'SerifEmb',files:[['normal','liberationserif-regular.ttf',400],['bold','liberationserif-bold.ttf',700]]},
  charm:{pdf:'Charm',css:'CharmEmb',files:[['normal','charm-regular.ttf',400],['bold','charm-bold.ttf',700]]},
  vibes:{pdf:'GreatVibes',css:'VibesEmb',files:[['normal','greatvibes-regular.ttf',400]]}
};
const fontBin={};      // key -> [[style, filename, binaryString]]
const fontLoading={};  // key -> Promise
function ab2bin(buf){const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return s}
function loadFamily(key){
  if(fontLoading[key]) return fontLoading[key];
  const f=FONTS[key];
  fontLoading[key]=Promise.all(f.files.map(([style,file,weight])=>fetch(FONT_DIR+file).then(r=>{if(!r.ok)throw new Error(file);return r.arrayBuffer()}).then(buf=>{
    try{const face=new FontFace(f.css,buf,{weight:String(weight)});document.fonts.add(face);face.load().catch(()=>{})}catch(e){}
    return [style,file,ab2bin(buf)];
  }))).then(list=>{fontBin[key]=list;if(measurer)addFamily(measurer,key);return true})
   .catch(e=>{delete fontLoading[key];throw e});
  return fontLoading[key];
}
const usedFamilies=()=>{const s=new Set(['sans']);plates.forEach(p=>p.lines.forEach(l=>s.add(fontKey(l.font))));return [...s]};
const ensureFonts=keys=>Promise.all(keys.map(loadFamily));
function addFamily(doc,key){const f=FONTS[key];for(const [style,file,bin] of fontBin[key]){doc.addFileToVFS(file,bin);doc.addFont(file,f.pdf,style)}}

/* jsPDF wczytywany asynchronicznie, żeby strona pokazała się od razu */
let jspdfReady=null;
function loadJsPdf(){
  if(window.jspdf) return Promise.resolve();
  if(jspdfReady) return jspdfReady;
  jspdfReady=new Promise((res,rej)=>{const s=document.createElement('script');s.src='assets/jspdf.umd.min.js?v=2';s.onload=()=>res();s.onerror=()=>{jspdfReady=null;rej(new Error('jspdf'))};document.head.append(s)});
  return jspdfReady;
}

/* ---------- state ---------- */
let uid=1;
const okCol=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():null;
const lineSize=v=>Number.isFinite(+v)&&+v>=4.5&&+v<=200?+v:null;
const fontKey=f=>['serif','charm','vibes'].includes(f)?f:'sans';
const fontName=l=>FONTS[fontKey(l.font)].pdf;
const fontCss=l=>({sans:'MontserratEmb, sans-serif',serif:'SerifEmb, serif',charm:'CharmEmb, cursive',vibes:'VibesEmb, cursive'})[fontKey(l.font)];
const fontStyle=l=>l.bold&&l.font!=='vibes'?'bold':'normal';
const ascent=l=>l.font==='vibes'?1.1:l.font==='charm'?0.95:0.72;
const descent=l=>l.font==='vibes'?0.5:l.font==='charm'?0.35:0.22;
const lineStep=(prev,next,a,b,o)=>Math.max(0.22*a+(o.lh-0.22)*b,descent(prev)*a+(ascent(next)+0.15)*b)+next.gap*(b/next.scale);
const MEDAL_SIZES=[27,41,52];
const safeDiameter=p=>({27:23.5,41:37.5,52:48.5})[p.w]||p.w-3.5;
const validLogo=l=>l&&/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(l.data)&&l.w>0&&l.h>0?{data:l.data,w:l.w,h:l.h,r:Number.isFinite(l.r)&&l.r>0?l.r:Math.hypot(l.w,l.h)/2}:null;
const itemName=p=>p.shape==='medal'?'Medal':'Blaszka';
const mk=p=>({id:uid++,shape:p.shape==='medal'?'medal':'plate',w:p.shape==='medal'?(MEDAL_SIZES.includes(+p.w)?+p.w:27):p.w,h:p.shape==='medal'?(MEDAL_SIZES.includes(+p.w)?+p.w:27):p.h,copies:p.copies||1,logo:validLogo(p.logo),pt:p.pt||null,footer:p.footer||'',footerColor:okCol(p.footerColor),lines:(p.lines||[]).map(l=>({text:l.text,bold:!!l.bold,italic:!!l.italic,color:okCol(l.color),size:lineSize(l.size),font:fontKey(l.font)}))});
let plates=[];
const KEY='blaszki-state-v3';
function persist(){try{localStorage.setItem(KEY,JSON.stringify(plates.map(({id,...r})=>r)));localStorage.setItem(KEY+'-options',JSON.stringify(opts()));$('save-status').textContent='Zapisano w przeglądarce'}catch(e){$('save-status').textContent='Nie udało się zapisać danych'}}
function restore(){try{const s=localStorage.getItem(KEY);if(s){const a=JSON.parse(s);if(Array.isArray(a))return a}}catch(e){}return null}

/* ---------- kolory ---------- */
const PALETTE=[['#000000','czarny'],['#5f6368','szary'],['#c00000','czerwony'],['#7b1f1f','bordowy'],['#e06c00','pomarańczowy'],['#b8860b','złoty'],
  ['#1e7b34','zielony'],['#0b4d22','ciemnozielony'],['#0b57d0','niebieski'],['#102a5c','granatowy'],['#6a1b9a','fioletowy'],['#6d4c2f','brązowy']];
const plain=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l').replace(/\s+/g,'');
const COLOR_BY_NAME={};PALETTE.forEach(([c,n])=>{COLOR_BY_NAME[plain(n)]=c});
Object.assign(COLOR_BY_NAME,{czarna:'#000000',czerwona:'#c00000',zielona:'#1e7b34',niebieska:'#0b57d0',granat:'#102a5c',zlota:'#b8860b',zloto:'#b8860b',szara:'#5f6368',bordo:'#7b1f1f',fiolet:'#6a1b9a',brazowa:'#6d4c2f',pomaranczowa:'#e06c00'});
const colorName=c=>{const e=PALETTE.find(([h])=>h===c);return e?e[1]:null};

/* ---------- format tekstowy ---------- */
/* Znaczniki na początku linii: *  _  @  oraz [czerwony] [20pt] [times] [charm] [vibes] [#c00000].
   Dla zgodności rozpoznawane są też stare zapisy {pt:20} {font:serif} {#c00000} i nawiasy okrągłe. */
const FONT_ALIAS={serif:'serif',times:'serif',timesnewroman:'serif',szeryfowa:'serif',liberation:'serif',liberationserif:'serif',
  charm:'charm',kaligraficzna:'charm',vibes:'vibes',greatvibes:'vibes',pisana:'vibes',sans:'sans',montserrat:'sans',zwykla:'sans'};
function readTag(s){
  const m=s.match(/^(\[([^\]\n]{1,30})\]|\{([^}\n]{1,30})\}|\(([^)\n]{1,30})\))/); if(!m) return null;
  const raw=(m[2]||m[3]||m[4]).trim(), t=plain(raw); let r;
  if((r=t.match(/^(?:pt:?)?(\d+(?:[.,]\d+)?)pt$/))||(r=t.match(/^pt:(\d+(?:[.,]\d+)?)$/))){const v=lineSize(num(r[1]));return v?{len:m[0].length,size:v}:null}
  if((r=t.match(/^(?:font:|czcionka:)?([a-z]+)$/))&&FONT_ALIAS[r[1]]) return {len:m[0].length,font:FONT_ALIAS[r[1]]};
  if((r=t.match(/^(?:kolor:)?#([0-9a-f]{6}|[0-9a-f]{3})$/))){let h=r[1];if(h.length===3)h=h.replace(/./g,c=>c+c);return {len:m[0].length,color:'#'+h}}
  if((r=t.match(/^(?:kolor:)?(.+)$/))&&COLOR_BY_NAME[r[1]]) return {len:m[0].length,color:COLOR_BY_NAME[r[1]]};
  return null;
}
/* Zdejmuje wszystkie znaczniki z początku linii. */
function readMarks(str){
  let s=str.trim(),bold=false,italic=false,foot=false,color=null,size=null,font='sans',tag;
  for(;;){
    if(s[0]==='*'){bold=true;s=s.slice(1)}
    else if(s[0]==='_'){italic=true;s=s.slice(1)}
    else if(s[0]==='@'){foot=true;s=s.slice(1)}
    else if((tag=readTag(s))){if(tag.size)size=tag.size;if(tag.font)font=tag.font;if(tag.color)color=tag.color;s=s.slice(tag.len).replace(/^ (?=\S)/,'')}
    else break;
  }
  return {text:s.trim(),bold,italic,foot,color,size,font};
}
const SIZE_RE=/^\s*(\d+(?:[.,]\d+)?)\s*([x×X*\/])\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?(.*)$/i;
function parseSize(s){
  const medal=s.match(/^\s*medal\s+(27|41|52)\s*(?:mm)?(?:\s+(\d+)\s*szt)?(?:\s+(\d+(?:[.,]\d+)?)\s*pt)?\s*$/i);
  if(medal)return {shape:'medal',w:+medal[1],h:+medal[1],copies:+medal[2]||1,pt:medal[3]?num(medal[3]):null};
  const m=s.match(SIZE_RE); if(!m) return null;
  const rest=m[5]||'';
  if(rest.trim() && !/^(\s*(\d+\s*szt\.?|x\s*\d+|\d+(?:[.,]\d+)?\s*pt))*\s*$/i.test(rest)) return null;
  const k=(m[2]==='/'||(m[4]||'').toLowerCase()==='cm')?10:1;
  const copies=(rest.match(/(\d+)\s*szt/i)||rest.match(/x\s*(\d+)/i)||[])[1];
  const pt=(rest.match(/(\d+(?:[.,]\d+)?)\s*pt/i)||[])[1];
  return {w:+(num(m[1])*k).toFixed(2),h:+(num(m[3])*k).toFixed(2),copies:copies?parseInt(copies):1,pt:pt?num(pt):null};
}
function fromText(text){
  // Bloki: pusta linia albo nowa linia z wymiarem zaczyna kolejną blaszkę (tekst skopiowany ze zdjęcia często nie ma pustych linii)
  const blocks=[];let cur=[];
  for(const raw of text.replace(/\r/g,'').split('\n')){
    if(!raw.trim()){if(cur.length){blocks.push(cur);cur=[]}continue}
    if(parseSize(raw)&&cur.some(l=>!parseSize(l))){blocks.push(cur);cur=[]}
    cur.push(raw);
  }
  if(cur.length) blocks.push(cur);
  const autoBold=!/^\s*\*/m.test(text), autoFoot=!/^\s*@/m.test(text);
  const isCaps=s=>{const L=readMarks(s).text.replace(/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g,'');return L.length>=3&&L===L.toUpperCase()&&!/\d/.test(s)&&!/^PZHGP\b/.test(s)};
  const isPlaceDate=s=>/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{3,}.*\b\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}\b/.test(s)||/^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}\b.*[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{3,}/.test(s);
  return blocks.map(lines=>{
    if(autoFoot&&lines.length>1&&isPlaceDate(lines[lines.length-1].trim())) lines=[...lines.slice(0,-1),'@'+lines[lines.length-1].trim()];
    if(autoBold) lines=lines.map(l=>!parseSize(l)&&!/^\s*[_@]/.test(l)&&isCaps(l.trim())?'*'+l.trim():l);
    let size=parseSize(lines[0]);
    if(size) lines=lines.slice(1); else size={w:80,h:25,copies:1,pt:null};
    let footer='',footerColor=null;const out=[];
    for(const raw of lines){
      const r=readMarks(raw); if(!r.text) continue;
      if(r.foot){footer=size.shape==='medal'&&footer?footer+'\n'+r.text:r.text;footerColor=r.color} else out.push({text:r.text,bold:r.bold,italic:r.italic,color:r.color,size:r.size,font:r.font});
    }
    return mk({...size,footer,footerColor,lines:out});
  });
}
const colorTag=c=>c&&c!=='#000000'?`[${colorName(c)||c}]`:'';
const sizeTag=v=>v?`[${String(v).replace('.',',')}pt]`:'';
const fontTag=f=>({serif:'[times]',charm:'[charm]',vibes:'[vibes]'})[fontKey(f)]||'';
function toText(){
  return plates.filter(p=>!p.logo).map(p=>[(p.shape==='medal'?`medal ${p.w}mm`:`${p.w}x${p.h}`)+(p.copies>1?` ${p.copies}szt`:'')+(p.pt?` ${p.pt}pt`:''),
    ...p.lines.map(l=>(l.bold?'*':'')+(l.italic?'_':'')+colorTag(l.color)+sizeTag(l.size)+fontTag(l.font)+l.text),
    ...(p.footer?p.footer.split('\n').map(t=>'@'+colorTag(p.footerColor)+t):[])].join('\n')).join('\n\n');
}

/* ---------- pdf / metrics ---------- */
function newDoc(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
  Object.keys(fontBin).forEach(k=>addFamily(doc,k));
  return doc;
}
let measurer=null;
const SKEW=Math.tan(12*Math.PI/180);
function textW(str,bold,pt,italic,font){measurer.setFont(fontName({font}),fontStyle({font,bold}));measurer.setFontSize(pt);return measurer.getTextWidth(str)+(italic?SKEW*ascent({font})*pt*PT:0)+(['charm','vibes'].includes(font)?0.35*pt*PT:0)}
const FOOT_SCALE=0.85, FOOT_GAP=0.30;

function opts(){
  return {margin:num($('o-margin').value,7),gap:num($('o-gap').value,0),padx:num($('o-padx').value,4.5),pady:num($('o-pady').value,2.5),
    max:num($('o-max').value,14),lh:num($('o-lh').value,1.45),stroke:num($('o-stroke').value,0.1),color:$('o-color').value};
}
function fit(p,o){
  if(p.shape==='medal'&&p.logo){p.vis=[];p.fs=0;p.overflow=false;p.small=false;return}
  const lines=p.lines.filter(l=>l.text.trim()).map(l=>({...l,scale:1,gap:0}));
  if(p.footer&&p.footer.trim()){
    const foot=p.shape==='medal'?p.footer.split('\n').map(t=>t.trim()).filter(Boolean):[p.footer.trim()];
    foot.forEach((text,i)=>lines.push({text,bold:false,italic:true,color:p.footerColor,scale:p.shape==='medal'?0.68:FOOT_SCALE,gap:i?0:lines.length?(p.shape==='medal'?1.35:FOOT_GAP):0,footer:true}));
  }
  p.vis=lines;
  const n=lines.length; if(!n||p.w<=0||p.h<=0){p.fs=0;p.overflow=false;p.small=false;return}
  const medal=p.shape==='medal';
  if(medal){fitMedal(p,o);return}
  const diameter=safeDiameter(p);
  const inset=medal?(p.w-diameter)/2:0;
  const availW=p.w-2*(medal?inset:o.padx), availH=p.h-2*(medal?inset:o.pady);
  const sizes=base=>lines.map(l=>lineSize(l.size)||(medal?Math.min(base*l.scale,availW/Math.max(0.001,textW(l.text,l.bold,1,l.italic,l.font))):base*l.scale));
  const height=ss=>ascent(lines[0])*ss[0]+descent(lines[n-1])*ss[n-1]+ss.slice(1).reduce((sum,z,i)=>sum+lineStep(lines[i],lines[i+1],ss[i],z,o),0);
  const width=ss=>Math.max(...lines.map((l,i)=>textW(l.text,l.bold,ss[i],l.italic,l.font)));
  const circleFits=(ss,padding)=>{
    if(p.shape!=='medal')return true;
    const r=Math.max(0,p.w/2-padding), block=height(ss)*PT;
    let y=-block/2+p.w*0.025+ascent(lines[0])*ss[0]*PT;
    return lines.every((l,i)=>{
      if(i)y+=lineStep(lines[i-1],l,ss[i-1],ss[i],o)*PT;
      const edge=Math.max(Math.abs(y-ascent(l)*ss[i]*PT),Math.abs(y+descent(l)*ss[i]*PT));
      const chord=edge<r?2*Math.sqrt(r*r-edge*edge):0;
      return textW(l.text,l.bold,ss[i],l.italic,l.font)<=chord;
    });
  };
  let fs=p.pt;
  if(!fs){
    let lo=0,hi=medal?Math.max(o.max,p.w*0.55):o.max;
    for(let i=0;i<36;i++){const mid=(lo+hi)/2,ss=sizes(mid);if(width(ss)<=availW&&height(ss)*PT<=availH&&circleFits(ss,medal?inset:Math.max(o.padx,o.pady)))lo=mid;else hi=mid}
    fs=Math.max(0.1,Math.floor(lo*10+1e-7)/10);
  }
  let ss=sizes(fs);
  // Keep even manually sized medal text within the safe print circle.
  if(medal&&!circleFits(ss,inset)){
    let lo=0,hi=1;
    for(let i=0;i<36;i++){const k=(lo+hi)/2;if(circleFits(ss.map(z=>z*k),inset))lo=k;else hi=k}
    ss=ss.map(z=>z*lo);fs*=lo;
  }
  lines.forEach((l,i)=>l.size=ss[i]);
  p.fs=fs;p.blockH=height(ss)*PT;
  p.overflow=(!medal&&Math.min(...ss)<4.5)||width(ss)>p.w-0.6||p.blockH>p.h-0.6||!circleFits(ss,medal?(p.w-diameter)/2:0.3);
  p.small=!medal&&!p.overflow&&Math.min(...ss)<6;
}
function fitMedal(p,o){
  const radius=safeDiameter(p)/2,center=p.w/2;
  const body=p.vis.filter(l=>!l.footer),foot=p.vis.filter(l=>l.footer);
  function group(lines,cy,top,bottom,cap,spacing){
    if(!lines.length)return 0;
    const positions=base=>{
      const sizes=lines.map(l=>lineSize(l.size)||base);
      const steps=sizes.map((z,i)=>i?Math.max(descent(lines[i-1])*sizes[i-1]+(ascent(lines[i])+.13)*z,spacing*z):0);
      const height=(ascent(lines[0])*sizes[0]+descent(lines.at(-1))*sizes.at(-1)+steps.reduce((a,b)=>a+b,0))*PT;
      let y=cy-height/2+ascent(lines[0])*sizes[0]*PT;
      return lines.map((l,i)=>{y+=steps[i]*PT;return {size:sizes[i],y}});
    };
    const fits=ps=>ps.every((a,i)=>{
      const l=lines[i],t=a.y-ascent(l)*a.size*PT,b=a.y+descent(l)*a.size*PT;
      const edge=Math.max(Math.abs(t-center),Math.abs(b-center));
      return t>=top&&b<=bottom&&edge<radius&&textW(l.text,l.bold,a.size,l.italic,l.font)<=2*Math.sqrt(radius*radius-edge*edge);
    });
    let lo=0,hi=cap;
    for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(fits(positions(mid)))lo=mid;else hi=mid}
    let ps=positions(lo);
    // Manual sizes share the same hard safe circle constraint.
    if(!fits(ps)){const originals=lines.map(l=>l.size);lines.forEach((l,i)=>l.size=null);const max=Math.max(...originals.map(z=>z||cap));let a=0,b=max;for(let i=0;i<40;i++){const mid=(a+b)/2;if(fits(positions(mid)))a=mid;else b=mid}ps=positions(a);}
    lines.forEach((l,i)=>{l.size=ps[i].size;l.offsetY=ps[i].y});return Math.max(...ps.map(a=>a.size));
  }
  const base=group(body,p.h*(foot.length?.42:.5),p.h*.10,p.h*(foot.length?.66:.90),p.pt||p.w*1.1,1.12);
  group(foot,p.h*.79,p.h*.69,p.h*.91,Math.min(base?base*.48:p.w*.24,p.w*.24),1.15);
  p.fs=1;p.blockH=0;p.overflow=false;p.small=false;
}
function linePos(p,o){
  const L=p.vis;
  if(p.shape==='medal')return L.map(l=>({...l,x:p.x+p.w/2,y:p.y+l.offsetY}));
  let y=p.y+(p.h-p.blockH)/2+(p.shape==='medal'?p.w*0.025:0)+ascent(L[0])*L[0].size*PT;
  return L.map((l,i)=>{if(i)y+=lineStep(L[i-1],l,L[i-1].size,l.size,o)*PT;return {...l,x:p.x+p.w/2,y}});
}
/* Each free rectangle is split by straight guillotine cuts; circles use their square bounds. */
function pack(items,o){
  const W=PAGE_W-2*o.margin,H=PAGE_H-2*o.margin,g=Math.max(0,o.gap),E=1e-6;
  const sheets=[],bad=[];
  for(const p of items.slice().sort((a,b)=>b.h-a.h||b.w-a.w)){
    if(p.w<=0||p.h<=0||p.w>W+E||p.h>H+E){bad.push(p);continue}
    let best=null;
    sheets.forEach((s,si)=>s.free.forEach((r,ri)=>{
      if(p.w<=r.w+E&&p.h<=r.h+E){const score=si*1e12+r.w*r.h-p.w*p.h;if(!best||score<best.score)best={s,ri,r,score}}
    }));
    if(!best){const s={items:[],free:[{x:o.margin,y:o.margin,w:W,h:H}]};sheets.push(s);best={s,ri:0,r:s.free[0]}}
    const {s,r,ri}=best;s.free.splice(ri,1);p.x=r.x;p.y=r.y;s.items.push(p);
    // Full horizontal cut first, then a vertical cut in the occupied strip.
    const right={x:r.x+p.w+g,y:r.y,w:r.w-p.w-g,h:p.h};
    const below={x:r.x,y:r.y+p.h+g,w:r.w,h:r.h-p.h-g};
    for(const f of [right,below])if(f.w>E&&f.h>E)s.free.push(f);
  }
  return {pages:sheets.map(s=>s.items),bad,sheets};
}
function logoBox(p){
  const k=safeDiameter(p)/(2*(p.logo.r||Math.hypot(p.logo.w,p.logo.h)/2));
  const w=p.logo.w*k,h=p.logo.h*k;
  return {x:p.x+(p.w-w)/2,y:p.y+(p.h-h)/2,w,h};
}
// The crop preview and export use exactly the same transform and circular mask.
async function readLogo(file){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Wybierz plik PNG, JPG lub WebP.');
  const url=URL.createObjectURL(file),img=new Image();
  try{img.src=url;await img.decode();return await cropLogo(img)}finally{URL.revokeObjectURL(url)}
}
function cropLogo(img){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='crop-dialog';
    dialog.innerHTML=`<form method="dialog"><div class="crop-heading"><div><h2 id="crop-title">Dopasuj logo do medalu</h2><p>Przesuń grafikę i ustaw powiększenie.</p></div><button class="btn" value="cancel" aria-label="Zamknij kadrowanie">×</button></div>
      <div class="crop-stage"><canvas width="600" height="600" aria-label="Podgląd kadru logo. Przeciągnij grafikę lub użyj strzałek poniżej." tabindex="0"></canvas></div>
      <label class="crop-zoom">Powiększenie <output>100%</output><input aria-label="Powiększenie logo" type="range" min="20" max="400" value="100" step="1"></label>
      <div class="crop-tools"><div class="crop-arrows" role="group" aria-label="Przesuń logo"><button type="button" class="btn" data-move="-10,0" aria-label="Przesuń w lewo">←</button><button type="button" class="btn" data-move="0,-10" aria-label="Przesuń w górę">↑</button><button type="button" class="btn" data-move="0,10" aria-label="Przesuń w dół">↓</button><button type="button" class="btn" data-move="10,0" aria-label="Przesuń w prawo">→</button></div><button type="button" class="btn" data-reset>Wyśrodkuj i dopasuj</button><button class="btn primary" type="button" data-save>Zatwierdź kadr</button></div>
      <p class="crop-note">Na medalu znajdzie się dokładnie to, co widzisz wewnątrz koła. Wszystko poza kołem zostanie przycięte. Sprawdź kadr przed zatwierdzeniem — zachowamy Twoje ustawienie i bezpieczny margines.</p>
      </form>`;
    dialog.setAttribute('aria-labelledby','crop-title');document.body.append(dialog);
    const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),range=dialog.querySelector('input'),output=dialog.querySelector('output');
    let dx=0,dy=0,zoom=1,drag=null,done=false;
    const base=600/Math.max(img.naturalWidth,img.naturalHeight);
    function paint(target,size,preview){const c=target.getContext('2d'),k=size/600;c.clearRect(0,0,size,size);c.save();c.beginPath();c.arc(size/2,size/2,size/2,0,Math.PI*2);c.clip();c.fillStyle='#fff';c.fillRect(0,0,size,size);const w=img.naturalWidth*base*zoom*k,h=img.naturalHeight*base*zoom*k;c.drawImage(img,size/2+dx*k-w/2,size/2+dy*k-h/2,w,h);c.restore();if(preview){c.strokeStyle='#245cc7';c.lineWidth=3;c.beginPath();c.arc(size/2,size/2,size/2-2,0,Math.PI*2);c.stroke()}}
    function draw(){paint(canvas,600,true);output.textContent=Math.round(zoom*100)+'%';range.value=Math.round(zoom*100)}
    range.oninput=()=>{zoom=+range.value/100;draw()};
    canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag)return;const k=600/canvas.getBoundingClientRect().width;dx+=(e.clientX-drag.x)*k;dy+=(e.clientY-drag.y)*k;drag={x:e.clientX,y:e.clientY};draw()};
    canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
    canvas.onkeydown=e=>{const moves={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};if(moves[e.key]){e.preventDefault();dx+=moves[e.key][0];dy+=moves[e.key][1];draw()}};
    dialog.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.move.split(',').map(Number);dx+=x;dy+=y;draw()});
    dialog.querySelector('[data-reset]').onclick=()=>{dx=dy=0;zoom=1;draw()};
    const finish=value=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(value)};
    dialog.oncancel=e=>{e.preventDefault();finish(null)};dialog.onclose=()=>finish(null);
    dialog.querySelector('[data-save]').onclick=()=>{const out=document.createElement('canvas');out.width=out.height=1000;paint(out,1000,false);finish({data:out.toDataURL('image/png'),w:1000,h:1000,r:500})};
    draw();dialog.showModal();
  });
}

/* ---------- step 1: cards ---------- */
const colorBtn=c=>`<button type="button" class="btn boldt ic colbtn" data-act="color" aria-label="Kolor liter" title="Kolor liter"><span class="ai">A<span class="bar" style="background:${c||'#000000'}"></span></span></button>`;
function lineRow(p,li){
  const l=p.lines[li];
  return `<div class="line" data-li="${li}"><label class="line-label" for="t-${p.id}-${li}">Linia ${li+1}</label>
    <input type="text" id="t-${p.id}-${li}" class="${l.bold?'b':''}${l.italic?' i':''}" value="${esc(l.text)}" aria-label="${itemName(p)} ${idxOf(p)}, linia ${li+1}" data-act="text"${l.color?` style="color:${l.color}"`:''}>
    <div class="tg line-toolbar" role="group" aria-label="Formatowanie linii ${li+1}">
      <button type="button" class="btn boldt ic" data-act="bold" aria-pressed="${l.bold}" aria-label="Pogrubienie" title="Pogrubienie"><span class="bi">B</span></button>
      <button type="button" class="btn boldt ic it" data-act="italic" aria-pressed="${l.italic}" aria-label="Kursywa" title="Kursywa"><span class="ii">I</span></button>
      ${colorBtn(l.color)}
      <button type="button" class="btn ic font-choice font-sans" data-act="font-sans" aria-pressed="${fontKey(l.font)==='sans'}" aria-label="Czcionka Montserrat" title="Montserrat — bezszeryfowa"><span aria-hidden="true">Aa</span></button>
      <button type="button" class="btn ic font-choice font-serif" data-act="font-serif" aria-pressed="${l.font==='serif'}" aria-label="Czcionka Times — Liberation Serif" title="Times — Liberation Serif"><span aria-hidden="true">Aa</span></button>
      <button type="button" class="btn ic font-choice font-charm" data-act="font-charm" aria-pressed="${l.font==='charm'}" aria-label="Czcionka Charm — kaligraficzna" title="Charm — kaligraficzna"><span aria-hidden="true">Aa</span></button>
      <button type="button" class="btn ic font-choice font-vibes" data-act="font-vibes" aria-pressed="${l.font==='vibes'}" aria-label="Czcionka Great Vibes — pisana" title="Great Vibes — pisana"><span aria-hidden="true">Aa</span></button>
      <label class="size-picker" title="Rozmiar w punktach. Puste pole = Auto."><input type="number" min="4.5" max="200" step="0.5" inputmode="decimal" placeholder="Auto" value="${l.size||''}" data-act="line-size" aria-label="Rozmiar linii ${li+1} w punktach" aria-describedby="size-help-${p.id}"></label>
      <button type="button" class="btn toolbar-auto" data-act="line-auto" title="Przywróć automatyczny rozmiar linii ${li+1}" aria-label="Automatyczny rozmiar linii ${li+1}">Auto</button>
      <button type="button" class="btn x" data-act="del-line" aria-label="Usuń linię ${li+1}" title="Usuń linię">×</button>
    </div>
  </div>`;
}
const idxOf=p=>plates.indexOf(p)+1;
function cardHtml(p){
  const i=idxOf(p);
  return `<article class="plate" id="card-${p.id}" data-id="${p.id}" aria-label="${itemName(p)} ${i}">
    <div class="plate-h">
      <h3 class="plate-title">${itemName(p)} ${i}${p.logo?' · logo / rewers':''}</h3>
      <div class="dims ${p.shape==='medal'?'medal-dims':''}">
        ${p.shape==='medal'?`<label class="f"><span>Średnica (mm)</span><select data-act="diameter" aria-label="Średnica medalu">${MEDAL_SIZES.map(d=>`<option value="${d}" ${d===p.w?'selected':''}>${d} mm</option>`).join('')}</select></label>`:`
        <label class="f n"><span>Szerokość (mm)</span><input type="number" inputmode="decimal" step="0.5" min="1" id="w-${p.id}" value="${p.w}" data-act="w"></label>
        <span class="times" aria-hidden="true">×</span>
        <label class="f n"><span>Wysokość (mm)</span><input type="number" inputmode="decimal" step="0.5" min="1" id="h-${p.id}" value="${p.h}" data-act="h"></label>`}
        <label class="f n"><span>Liczba sztuk</span><input type="number" inputmode="numeric" step="1" min="1" id="c-${p.id}" value="${p.copies}" data-act="copies"></label>
      </div>
    </div>
    ${p.shape==='medal'?`<div class="medal-logo"><div><strong>${p.logo?'Logo na rewers':'Logo na drugą stronę medalu'}</strong><p class="type-help">${p.logo?'Twój zatwierdzony kadr z bezpiecznym marginesem.':'Wybierz grafikę i przytnij ją w okienku. Powstanie osobny medal z logo, w tym samym rozmiarze i liczbie sztuk.'}</p></div><button class="btn medal-add" type="button" data-act="add-logo">${p.logo?'Zmień logo':'Dodaj logo'}</button><input hidden type="file" accept="image/png,image/jpeg,image/webp" data-act="logo-file" aria-label="Wybierz logo"></div>`:''}
    <div class="lines" ${p.logo?'hidden':''}>
      <div class="lines-label">Treść ${p.shape==='medal'?'medalu':'blaszki'}</div><p class="type-help" id="size-help-${p.id}">Puste pole rozmiaru = Auto. Wpisz wartość, aby powiększyć lub pomniejszyć linię. Przycisk Auto przywraca dopasowanie.</p>
      ${p.lines.map((_,li)=>lineRow(p,li)).join('')}
    </div>
    <div class="foot" ${p.logo?'hidden':''}>
      <label class="f" for="f-${p.id}"><span>Dolny napis (opcjonalnie, kursywą)</span></label>
      <div class="footrow" data-li="foot">
        ${p.shape==='medal'?`<textarea id="f-${p.id}" rows="2" placeholder="Miejscowość&#10;Data" data-act="footer" aria-describedby="footer-help-${p.id}"${p.footerColor?` style="color:${p.footerColor}"`:''}>${esc(p.footer||'')}</textarea>`:`<input type="text" id="f-${p.id}" value="${esc(p.footer||'')}" placeholder="np. Hażlach, 25.10.2026" data-act="footer"${p.footerColor?` style="color:${p.footerColor}"`:''}>`}
        ${p.shape==='medal'?`<small id="footer-help-${p.id}" class="footer-help">Enter dodaje kolejną linię dolnego napisu.</small>`:''}
      </div>
      <button type="button" class="btn small" data-act="footer-all">Wpisz to samo we wszystkich projektach</button>
    </div>
    <div class="plate-warn" data-warn hidden></div>
    <div class="row">
      <button type="button" class="btn" data-act="add-line" ${p.logo?'hidden':''}>Dodaj linię</button>
      <button type="button" class="btn" data-act="dup">Duplikuj</button>
      ${p.shape==='medal'?'<button type="button" class="btn" data-act="fill-sheet">Zapełnij całą kartkę</button>':''}
      <button type="button" class="btn danger" data-act="del">Usuń ${p.shape==='medal'?'medal':'blaszkę'}</button>
    </div>
  </article>`;
}
function renderCards(){ $('cards').innerHTML=plates.length?plates.map(cardHtml).join(''):`<div class="hint"><img class="empty-icon" src="assets/logo-128.webp" width="48" height="48" alt=""><h3>Twoja pierwsza blaszka</h3><p>Zacznij od wymiarów i treści.<br>Gotowy układ zobaczysz obok.</p></div>`; }
const byId=id=>plates.find(p=>p.id===+id);

$('cards').addEventListener('input',e=>{
  const card=e.target.closest('.plate'); if(!card) return; const p=byId(card.dataset.id); const act=e.target.dataset.act;
  if(act==='text'){p.lines[+e.target.closest('.line').dataset.li].text=e.target.value}
  else if(act==='line-size'){p.lines[+e.target.closest('.line').dataset.li].size=lineSize(e.target.value)}
  else if(act==='w'){p.w=num(e.target.value,0)} else if(act==='h'){p.h=num(e.target.value,0)}
  else if(act==='diameter'&&MEDAL_SIZES.includes(+e.target.value)){p.w=p.h=+e.target.value}
  else if(act==='copies'){p.copies=Math.max(1,parseInt(e.target.value)||1)}
  else if(act==='footer'){p.footer=e.target.value}
  changed();
});
$('cards').addEventListener('change',async e=>{
  if(e.target.dataset.act!=='logo-file')return;
  const input=e.target,p=byId(input.closest('.plate').dataset.id),file=input.files[0];if(!file)return;
  try{const logo=await readLogo(file);if(!logo||!plates.includes(p))return;
    if(p.logo){p.logo=logo;rerenderCard(p);changed()}
    else{const back=mk({shape:'medal',w:p.w,copies:p.copies,logo,lines:[]});plates.splice(plates.indexOf(p)+1,0,back);renderCards();changed();flash(back,true)}
    toast('Logo dopasowane. Rewers jest osobnym elementem do wydruku.');
  }catch(err){toast(err.message||'Nie udało się odczytać logo. Spróbuj innego pliku.')}finally{input.value=''}
});
$('cards').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.dataset.act==='text'){
    e.preventDefault(); const card=e.target.closest('.plate'); const p=byId(card.dataset.id); const li=+e.target.closest('.line').dataset.li;
    p.lines.splice(li+1,0,{text:'',bold:false}); rerenderCard(p); focusLine(p,li+1); changed();
  }
});
$('cards').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return; const card=b.closest('.plate'); if(!card) return;
  const p=byId(card.dataset.id); const act=b.dataset.act;
  if(['font-sans','font-serif','font-charm','font-vibes'].includes(act)){const li=+b.closest('.line').dataset.li;p.lines[li].font=fontKey(act.slice(5));b.closest('.line-toolbar').querySelectorAll('.font-choice').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));loadFamily(p.lines[li].font).catch(()=>{});changed();return}
  if(act==='add-logo'){card.querySelector('[data-act=logo-file]').click();return}
  if(act==='fill-sheet'){
    const o=opts(),g=Math.max(0,o.gap);
    const cols=Math.floor((PAGE_W-2*o.margin+g)/(p.w+g)),rows=Math.floor((PAGE_H-2*o.margin+g)/(p.h+g));
    if(cols<1||rows<1){toast('Medal nie mieści się na kartce przy tych marginesach.');return}
    p.copies=cols*rows;rerenderCard(p);changed();
    toast(`Ustawiono ${p.copies} medali (${cols} × ${rows}) — pełna kartka tego wzoru. Inne projekty pozostają na liście.`);return;
  }
  if(act==='line-auto'){const li=+b.closest('.line').dataset.li;p.lines[li].size=null;rerenderCard(p);changed();$('card-'+p.id).querySelectorAll('[data-act="line-size"]')[li].focus();return}
  if(act==='color'){const li=b.closest('[data-li]').dataset.li;openPop(b,p,li==='foot'?'foot':+li);return}
  if(act==='italic'){const li=+b.closest('.line').dataset.li;p.lines[li].italic=!p.lines[li].italic;rerenderCard(p);changed();$(`t-${p.id}-${li}`).focus()}
  else if(act==='footer-all'){
    const v=p.footer.trim(); const old=plates.map(q=>q.footer);
    plates.forEach(q=>q.footer=q.shape==='medal'?v:v.replace(/\n/g,', ')); renderCards(); changed(); flash(p,false);
    toast(v?`Wpisano „${v}” na wszystkich blaszkach.`:'Usunięto dolny napis ze wszystkich blaszek.',()=>{plates.forEach((q,i)=>q.footer=old[i]);renderCards();changed()});
  }
  else if(act==='bold'){const li=+b.closest('.line').dataset.li;p.lines[li].bold=!p.lines[li].bold;rerenderCard(p);changed();$(`t-${p.id}-${li}`).focus()}
  else if(act==='del-line'){const li=+b.closest('.line').dataset.li;p.lines.splice(li,1);rerenderCard(p);changed()}
  else if(act==='add-line'){p.lines.push({text:'',bold:false});rerenderCard(p);focusLine(p,p.lines.length-1);changed()}
  else if(act==='dup'){const c=mk(p);plates.splice(plates.indexOf(p)+1,0,c);renderCards();changed();flash(c,true)}
  else if(act==='del'){const at=plates.indexOf(p);plates.splice(at,1);renderCards();changed();toast(`Usunięto blaszkę ${at+1}.`,()=>{plates.splice(at,0,p);renderCards();changed();flash(p,true)})}
});
function rerenderCard(p){const el=$('card-'+p.id);if(el){el.outerHTML=cardHtml(p);applyWarns()}}
function focusLine(p,li){const el=$(`t-${p.id}-${li}`);if(el)el.focus()}
function flash(p,scroll){selectPlate(p.id);const el=$('card-'+p.id);if(!el)return;if(scroll)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});el.classList.add('flash');selectPlate(p.id)}

$('add-plate').addEventListener('click',()=>{
  const last=plates.filter(p=>p.shape!=='medal').at(-1);
  const p=mk({w:last?last.w:80,h:last?last.h:25,lines:[{text:'',bold:false}]});
  plates.push(p); renderCards(); changed(); flash(p,true); focusLine(p,0);
});

$('add-medal').addEventListener('click',()=>{
  const p=mk({shape:'medal',w:27,h:27,lines:[{text:'',bold:false}]});
  plates.push(p);renderCards();changed();flash(p,true);focusLine(p,0);
});

/* ---------- kolor liter (okienko) ---------- */
let popT=null;
function curColor(){const {p,li}=popT;return (li==='foot'?p.footerColor:p.lines[li].color)||'#000000'}
function setColor(c,all){
  const {p,li}=popT; c=okCol(c)||'#000000'; const v=c==='#000000'?null:c;
  if(all){p.lines.forEach(l=>l.color=v)} else if(li==='foot') p.footerColor=v; else p.lines[li].color=v;
  rerenderCard(p); changed();
}
function openPop(btn,p,li){
  popT={p,li};
  const cur=curColor();
  $('pop-slot').innerHTML=`<div class="pop" role="dialog" aria-label="Kolor liter" id="pop">
    <div class="pop-h">Kolor liter</div>
    <div class="sw">${PALETTE.map(([c,n])=>`<button type="button" style="background:${c}" data-c="${c}" aria-label="${n}" title="${n}" aria-pressed="${c===cur}"></button>`).join('')}</div>
    <label class="custom">Własny kolor: <input type="color" id="pop-custom" value="${cur}"></label>
    <div class="row"><button type="button" class="btn" id="pop-all">Ten kolor na całą blaszkę</button><button type="button" class="btn" id="pop-close">Zamknij</button></div>
  </div>`;
  const pop=$('pop'), r=btn.getBoundingClientRect(), pw=pop.offsetWidth, ph=pop.offsetHeight;
  const left=Math.min(Math.max(16,r.right-pw),innerWidth-pw-16); let top=r.bottom+6;
  if(top+ph>innerHeight-16) top=Math.max(16,r.top-ph-6);
  pop.style.left=left+'px'; pop.style.top=top+'px';
  pop.querySelectorAll('.sw button').forEach(s=>s.onclick=()=>{setColor(s.dataset.c,false);closePop()});
  $('pop-custom').oninput=e=>setColor(e.target.value,false);
  $('pop-all').onclick=()=>{setColor($('pop-custom').value,true);closePop();toast('Ustawiono kolor na całą blaszkę.')};
  $('pop-close').onclick=closePop;
  const sel=pop.querySelector('[aria-pressed="true"]'); if(sel) sel.focus();
}
function closePop(){ if(!popT) return; const {p,li}=popT; popT=null; $('pop-slot').innerHTML='';
  const card=$('card-'+p.id); const el=card&&card.querySelector(`[data-li="${li}"] [data-act="color"]`); if(el) el.focus(); }
document.addEventListener('mousedown',e=>{if(popT&&!e.target.closest('#pop')&&!e.target.closest('[data-act="color"]'))closePop()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&popT)closePop()});

$('clear-all').addEventListener('click',()=>{
  $('confirm-slot').innerHTML=`<div class="confirm"><span>Na pewno usunąć wszystkie blaszki i medale?</span><button class="btn danger" id="yes-clear" type="button">Tak, usuń</button><button class="btn" id="no-clear" type="button">Anuluj</button></div>`;
  $('yes-clear').onclick=()=>{const old=plates;plates=[];renderCards();changed();$('confirm-slot').innerHTML='';toast('Usunięto wszystkie blaszki.',()=>{plates=old;renderCards();changed()})};
  $('no-clear').onclick=()=>{$('confirm-slot').innerHTML=''};
  $('no-clear').focus();
});

/* ---------- tabs ---------- */
function showTab(which){
  const form=which==='form';
  $('tab-form').setAttribute('aria-selected',form); $('tab-paste').setAttribute('aria-selected',!form);
  $('panel-form').hidden=!form; $('panel-paste').hidden=form;
  $('tab-form').tabIndex=form?0:-1;$('tab-paste').tabIndex=form?-1:0;
  if(form) renderCards(); else $('src').value=toText();
}
$('tab-form').onclick=()=>showTab('form'); $('tab-paste').onclick=()=>showTab('paste');
$('src').addEventListener('input',()=>{plates=[...fromText($('src').value),...plates.filter(p=>p.logo)];changed()});

/* ---------- toast ---------- */
function toast(text,undo){
  $('toast-slot').innerHTML=`<div class="toast" role="status"><span>${esc(text)}</span>${undo?'<button class="btn" type="button" id="undo">Cofnij</button>':''}<button class="btn" id="dismiss-toast" type="button">Zamknij</button></div>`;
  if(undo) $('undo').onclick=()=>{$('toast-slot').innerHTML='';undo()};
  $('dismiss-toast').onclick=()=>{$('toast-slot').innerHTML=''};
}

/* ---------- step 2: preview ---------- */
let layout=null;
let currentPage=0, selectedId=null;
function build(){
  if(!measurer) return;
  const o=opts();
  const items=[];
  plates.forEach((p,i)=>{for(let c=0;c<Math.max(1,p.copies||1);c++) items.push({src:p,shape:p.shape,logo:p.logo,nr:i+1,w:p.w,h:p.h,pt:p.pt,lines:p.lines,footer:p.footer,footerColor:p.footerColor})});
  items.forEach(it=>fit(it,o));
  layout={o,items,...pack(items,o)};
  renderPreview(); applyWarns();
}
function sheetSvg(i){
  const {o,pages}=layout; const rgb=o.color; const pg=pages[i];
  let s=`<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Kartka ${i+1}">`;
  for(const p of pg){
    s+=`<g class="pl" data-id="${p.src.id}">`;
    const border=`class="box" fill="${p.overflow?'#fde3df':'#ffffff'}" stroke="rgb(${rgb})" stroke-width="${Math.max(o.stroke,0.18)}"`;
    s+=p.shape==='medal'?`<circle ${border} cx="${p.x+p.w/2}" cy="${p.y+p.h/2}" r="${p.w/2}"/>`:`<rect ${border} x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/>`;
    if(p.logo){const b=logoBox(p);s+=`<image href="${p.logo.data}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`;}
    if(p.fs) for(const l of linePos(p,o)) s+=`<text x="${l.x}" y="${l.y}" text-anchor="middle" font-family="${fontCss(l)}" font-weight="${fontStyle(l)==='bold'?700:400}"${l.font==='vibes'&&l.bold?` stroke="${l.color||'#000000'}" stroke-width="${l.size*PT*0.018}" paint-order="stroke fill"`:''} font-size="${l.size*PT}" fill="${l.color||'#000000'}"${l.italic?` transform="translate(${l.x} ${l.y}) skewX(-12) translate(${-l.x} ${-l.y})"`:''}>${esc(l.text)}</text>`;
    s+=`</g>`;
  }
  return s+'</svg>';
}
function renderPreview(){
  const {pages}=layout;
  $('sheets').innerHTML=pages.map((pg,i)=>`<div><div class="sheet-label">Kartka ${i+1} z ${pages.length}</div><div class="sheet">${sheetSvg(i)}</div></div>`).join('')
    || `<div class="hint">Tu pojawi się kartka z blaszkami, gdy wpiszesz pierwszą blaszkę.</div>`;
  $('dl').disabled=!pages.length;
  updateWorkspace();
}
const plural=(n,a,b,c)=>n===1?a:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?b:c;
$('sheets').addEventListener('click',e=>{
    const g=e.target.closest('.pl'); if(!g) return; const p=byId(g.dataset.id); if(!p) return;
  if($('panel-form').hidden) showTab('form');
  flash(p,true);
});

function applyWarns(){
  if(!layout) return;
  const msgs={};
  const add=(p,t)=>{(msgs[p.id]=msgs[p.id]||new Set()).add(t)};
  layout.bad.forEach(it=>add(it.src,'Projekt nie mieści się na kartce A4. Sprawdź marginesy i wymiar.'));
  layout.items.forEach(it=>{
    if(it.overflow) add(it.src,'Tekst wychodzi poza obramowanie. Wybierz Auto, zmniejsz ręczny rozmiar lub podziel tekst na krótsze linie.');
    else if(it.small) add(it.src,`Litery wyjdą małe (${fmt(it.fs)} pt). Może warto skrócić tekst.`);
  });
  plates.forEach(p=>{
    const el=$('card-'+p.id); if(!el) return; const w=el.querySelector('[data-warn]');
    const m=msgs[p.id]; el.classList.toggle('has-warn',!!m); w.hidden=!m; w.textContent=m?[...m].join(' '):'';
  });
  const count=Object.keys(msgs).length;
  $('warn-list').innerHTML=count?`<div class="msg err" style="margin:0 0 14px">${count===1?'1 projekt wymaga':count+' '+plural(count,'projekt wymaga','projekty wymagają','projektów wymaga')} poprawki. Jest zaznaczona na czerwono.</div>`:'';
}

/* Przelicza podgląd, gdy potrzebne czcionki są już wczytane. */
let t=null, buildSeq=0;
function refresh(){
  const seq=++buildSeq;
  return Promise.all([ready,ensureFonts(usedFamilies())]).then(()=>{if(seq===buildSeq)build()}).catch(()=>{if(seq===buildSeq){if(measurer)build();say('err','Nie udało się wczytać czcionki. Sprawdź połączenie i odśwież stronę.')}});
}
function changed(){$('dl-msg').innerHTML='';$('save-status').textContent='Zapisywanie…';clearTimeout(t);t=setTimeout(()=>{persist();refresh()},180)}
['o-margin','o-gap','o-padx','o-pady','o-max','o-lh','o-stroke','o-color'].forEach(id=>{$(id).addEventListener('input',changed);$(id).addEventListener('change',changed)});

/* ---------- step 3: download ---------- */
function fileName(){const d=new Date();return `blaszki-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.pdf`}
function makePdf(){return makePdfDoc().output('arraybuffer')}
function makePdfDoc(){
  const {o,pages}=layout; const doc=newDoc(); const rgb=o.color.split(',').map(Number);
  pages.forEach((pg,i)=>{
    if(i) doc.addPage('a4','portrait');
    doc.setDrawColor(...rgb); doc.setLineWidth(o.stroke); doc.setTextColor(0,0,0);
    for(const p of pg){
      if(o.stroke>0){if(p.shape==='medal')doc.circle(p.x+p.w/2,p.y+p.h/2,p.w/2,'S');else doc.rect(p.x,p.y,p.w,p.h,'S');}
      if(p.logo){const b=logoBox(p);doc.addImage(p.logo.data,'PNG',b.x,b.y,b.w,b.h,undefined,'FAST');}
      if(p.fs) for(const l of linePos(p,o)){
        doc.setFont(fontName(l),fontStyle(l));doc.setFontSize(l.size);
        const c=l.color||'#000000';doc.setTextColor(parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16));
        if(l.italic){const y0=(PAGE_H-l.y)*72/25.4;doc.internal.write(`q 1 0 ${SKEW.toFixed(4)} 1 ${(-SKEW*y0).toFixed(3)} 0 cm`)}
        const syntheticBold=l.font==='vibes'&&l.bold;if(syntheticBold){doc.setDrawColor(c);doc.setLineWidth(l.size*PT*0.018)}
        doc.text(l.text,l.x,l.y,{align:'center',baseline:'alphabetic',renderingMode:syntheticBold?'fillThenStroke':'fill'});
        if(syntheticBold){doc.setDrawColor(...rgb);doc.setLineWidth(o.stroke)}
        if(l.italic) doc.internal.write('Q');
      }
    }
  });
  doc.setProperties({title:'Blaszki',creator:'Generator Blaszek'});
  return doc;
}
let downloads=null;
const say=(cls,text)=>{$('dl-msg').innerHTML=text?`<div class="msg ${cls}" role="status">${text}</div>`:''};
function validateFields(){let valid=true;document.querySelectorAll('input[type=number]').forEach(el=>{const ok=(el.dataset.act==='line-size'&&el.value===''||el.value!==''&&Number.isFinite(+el.value)&&+el.value>=+(el.min||0)&&(!el.max||+el.value<=+el.max))&&(el.dataset.act!=='copies'||Number.isInteger(+el.value));if(!ok){valid=false;el.setAttribute('aria-invalid','true');let msg=el.parentElement.querySelector('.field-error');if(!msg){msg=document.createElement('span');msg.className='field-error';el.parentElement.append(msg)}msg.textContent='Wpisz poprawną wartość (minimum '+(el.min||0)+').'}else{el.removeAttribute('aria-invalid');const msg=el.parentElement.querySelector('.field-error');if(msg)msg.textContent=''}});return valid}
$('dl').addEventListener('click',async()=>{
  if(!validateFields()){say('err','Popraw zaznaczone pola przed pobraniem PDF.');const invalid=document.querySelector('[aria-invalid="true"]');if(invalid){const details=invalid.closest('details');if(details)details.open=true;invalid.focus()}return}
  $('dl').disabled=true; say('info','Przygotowuję PDF…');
  try{
    clearTimeout(t); await refresh(); await ensureFonts(usedFamilies()); build();
    if(!layout||!layout.pages.length) return;
    const name=fileName();
    if(downloads){
      await downloads.save({filename:name,data:makePdf()});
      say('ok',`Gotowe! Plik <b>${esc(name)}</b> jest w folderze Pobrane.`);
    } else {
      await new Promise(r=>setTimeout(r,30));
      await makePdfDoc().save(name,{returnPromise:true});
      say('ok',`Rozpoczęto pobieranie: <b>${esc(name)}</b>.`);
    }
  }catch(e){
    const c=e&&e.code;
    say('err',c==='declined'?'Zapis anulowany. Kliknij „Pobierz PDF”, aby spróbować ponownie.':c==='rate_limited'?'Okienko zapisu jest już otwarte. Potwierdź je.':'Nie udało się zapisać pliku. Spróbuj jeszcze raz.');
  }finally{$('dl').disabled=!(layout&&layout.pages.length)}
});

/* ---------- interfejs ---------- */
const icons={plus:'M12 5v14M5 12h14',copy:'M8 8h12v12H8zM16 8V4H4v12h4',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',edit:'m4 16-1 5 5-1L20 7l-4-4zM14 5l5 5',clipboard:'M9 5H5v16h14V5h-4M9 3h6v4H9z',print:'M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z'};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]}" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
function decorate(){document.querySelectorAll('[data-act],#add-plate,#add-medal,#clear-all,#dl,#tab-form,#tab-paste').forEach(b=>{if(b.dataset.decorated)return;const a=b.dataset.act||b.id;if(b.closest('.line-toolbar')){if(a==='bold')b.innerHTML='<span class="bi">B</span>';else if(a==='italic')b.innerHTML='<span class="ii">I</span>';else if(a==='del-line')b.innerHTML=icon('trash');b.dataset.decorated='true';return}const m={'add-plate':['plus','Dodaj blaszkę'],'add-medal':['plus','Dodaj medal'],'clear-all':['trash','Wyczyść listę'],'dl':['download','Pobierz PDF'],'tab-form':['edit','Wpisuję po kolei'],'tab-paste':['clipboard','Wklejam gotowy tekst'],'add-line':['plus','Dodaj linię'],'dup':['copy','Duplikuj'],'del':['trash','Usuń'],'del-line':['trash','Usuń linię']};if(m[a])b.innerHTML=icon(m[a][0])+(a==='tab-form'||a==='tab-paste'?'<span class="tab-label">'+m[a][1]+'</span>':m[a][1]);else if(a==='bold')b.innerHTML='<span class="bi">B</span> Pogrub';else if(a==='italic')b.innerHTML='<span class="ii">I</span> Kursywa';else if(a==='color')b.insertAdjacentHTML('beforeend',' Kolor');b.dataset.decorated='true'})}
function selectPlate(id){selectedId=id===null?null:+id;document.querySelectorAll('.plate').forEach(el=>el.classList.toggle('flash',+el.dataset.id===selectedId));document.querySelectorAll('#sheets .pl').forEach(el=>{el.classList.toggle('selected',+el.dataset.id===selectedId);el.setAttribute('aria-pressed',String(+el.dataset.id===selectedId))})}
function updateWorkspace(){if(!layout)return;const n=layout.pages.length;currentPage=Math.max(0,Math.min(currentPage,n-1));[...$('sheets').children].forEach((el,i)=>el.hidden=n>0&&i!==currentPage);$('page-count').textContent=n?`${currentPage+1} / ${n}`:'Brak kartek';$('prev-page').disabled=currentPage<=0;$('page-nav').hidden=n<2;$('next-page').disabled=currentPage>=n-1;$('summary').innerHTML=`<span class="stat"><b>${plates.length}</b> ${plural(plates.length,'projekt','projekty','projektów')}</span><span class="stat"><b>${layout.items.length}</b> ${plural(layout.items.length,'sztuka','sztuki','sztuk')}</span><span class="stat"><b>${n}</b> ${plural(n,'kartka','kartki','kartek')} A4</span>`;document.querySelectorAll('#sheets .pl').forEach(g=>{g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',`Edytuj ${byId(g.dataset.id).shape==='medal'?'medal':'blaszkę'} ${idxOf(byId(g.dataset.id))}`)});selectPlate(selectedId);decorate()}
$('prev-page').onclick=()=>{currentPage--;updateWorkspace()};$('next-page').onclick=()=>{currentPage++;updateWorkspace()};
$('cards').addEventListener('focusin',e=>{const c=e.target.closest('.plate');if(c)selectPlate(c.dataset.id)});
$('sheets').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.pl')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));const p=byId(e.target.closest('.pl').dataset.id);focusLine(p,0)}});
$('cards').addEventListener('input',e=>{if(!['w','h','copies'].includes(e.target.dataset.act))return;const el=e.target;const valid=el.value!==''&&+el.value>0&&(el.dataset.act!=='copies'||Number.isInteger(+el.value));el.setAttribute('aria-invalid',String(!valid));let error=el.parentElement.querySelector('.field-error');if(!error){error=document.createElement('span');error.className='field-error';error.id=el.id+'-error';el.parentElement.append(error);el.setAttribute('aria-describedby',error.id)}error.textContent=valid?'':el.dataset.act==='copies'?'Wpisz całkowitą liczbę większą od 0.':`Wpisz ${el.dataset.act==='w'?'szerokość':'wysokość'} większą od 0 mm.`});
document.querySelector('.tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const form=e.key==='Home'||e.key!=='End'&&document.activeElement.id==='tab-paste';showTab(form?'form':'paste');$(form?'tab-form':'tab-paste').focus()}});
new MutationObserver(decorate).observe($('cards'),{childList:true,subtree:true});

$('copy-paste-example').addEventListener('click',async()=>{
  const example=$('paste-example');
  try{await navigator.clipboard.writeText(example.textContent);$('copy-example-status').textContent='Skopiowano. Wklej przykład w polu „Tekst blaszek”.'}
  catch(e){const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(example);selection.removeAllRanges();selection.addRange(range);$('copy-example-status').textContent='Zaznaczono przykład. Skopiuj go skrótem Ctrl+C lub ⌘C.'}
});
/* Kliknięcie znacznika w pomocy kopiuje go do schowka. */
document.querySelector('.help-options').addEventListener('click',async e=>{
  const c=e.target.closest('[data-copy]'); if(!c) return;
  try{await navigator.clipboard.writeText(c.dataset.copy);c.classList.add('copied');setTimeout(()=>c.classList.remove('copied'),1200)}catch(err){}
});

/* ---------- start ---------- */
let ready;
function init(){
  try{const o=JSON.parse(localStorage.getItem(KEY+'-options'));if(o)Object.entries(o).forEach(([k,v])=>{if($('o-'+k))$('o-'+k).value=v})}catch(e){}
  const saved=restore();
  plates=(saved||[]).map(mk);
  renderCards(); decorate();
  $('sheets').innerHTML='<div class="hint loading">Wczytuję podgląd…</div>';
  $('dl').disabled=true;
  ready=Promise.all([loadJsPdf(),loadFamily('sans')]).then(()=>{measurer=newDoc()});
  ready.catch(()=>say('err','Nie wczytał się program do PDF. Sprawdź połączenie i odśwież stronę.'));
  refresh();
  // Pozostałe kroje dociągamy w wolnej chwili (Times tylko gdy jest używany — jest największy).
  const idle=window.requestIdleCallback||(f=>setTimeout(f,1200));
  idle(()=>{loadFamily('charm').catch(()=>{});loadFamily('vibes').catch(()=>{})});
  let tries=0;(function hook(){if(window.claude&&window.claude.use){window.claude.use('downloads').then(d=>{downloads=d}).catch(()=>{});return}if(++tries<10)setTimeout(hook,300)})();
}
init();




