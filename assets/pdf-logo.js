// PDF.js is loaded on demand; the PDF stays on the user's device.
import {prepareLogoDialogs,readLogoBuffer,loadLogoImage} from './logo-compat.js?v=1';
let library;
async function pdfLibrary(){
  if(!library)library=import('./pdfjs/build/pdf.min.mjs?v=compat1').catch(error=>{library=null;throw error});
  const pdfjs=await library;
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('./pdfjs/build/pdf.worker.min.mjs?v=compat1',import.meta.url).href;
  return pdfjs;
}
async function renderPage(pdf,number){
  const page=await pdf.getPage(number),base=page.getViewport({scale:1});
  const scale=Math.min(4,2400/Math.max(base.width,base.height));
  const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
  try{
    await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;
    return await loadLogoImage(canvas.toDataURL('image/png'));
  }finally{page.cleanup();canvas.width=canvas.height=0}
}
function choosePage(pdf){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='crop-dialog';
    dialog.innerHTML=`<form method="dialog"><div class="crop-heading"><h2>Wybierz stronę PDF z logo</h2><button class="btn" value="cancel" aria-label="Anuluj wybór strony">×</button></div><label class="f">Strona PDF<input type="number" min="1" max="${pdf.numPages}" value="1" step="1"></label><p>Dokument ma ${pdf.numPages} stron.</p><div style="height:300px;display:grid;place-items:center;background:#f4f6f9"><img alt="Podgląd wybranej strony PDF" style="max-width:100%;max-height:300px;object-fit:contain"></div><p role="status"></p><button class="btn primary" type="button" data-use disabled>Dalej: przytnij logo</button></form>`;
    document.body.append(dialog);
    if(window.logoDialogPolyfill)window.logoDialogPolyfill.registerDialog(dialog);
    const input=dialog.querySelector('input'),preview=dialog.querySelector('img'),status=dialog.querySelector('[role=status]'),use=dialog.querySelector('[data-use]');
    let seq=0,selected=null,closed=false;
    const finish=value=>{if(closed)return;closed=true;seq++;if(dialog.hasAttribute('open'))dialog.close();dialog.remove();resolve(value)};
    async function update(){
      const token=++seq,n=Number(input.value);selected=null;use.disabled=true;
      if(!Number.isInteger(n)||n<1||n>pdf.numPages){status.textContent=`Wybierz numer od 1 do ${pdf.numPages}.`;return}
      status.textContent='Wczytywanie strony…';
      try{const img=await renderPage(pdf,n);if(token!==seq)return;selected=img;preview.src=img.src;status.textContent=`Strona ${n} z ${pdf.numPages}`;use.disabled=false}catch{if(token===seq)status.textContent='Nie udało się odczytać strony. Wybierz inną stronę lub inny PDF.'}
    }
    input.addEventListener('input',update);use.onclick=()=>{if(selected)finish(selected)};
    dialog.oncancel=e=>{e.preventDefault();finish(null)};dialog.onclose=()=>finish(null);
    dialog.showModal();update();
  });
}
export async function readPdfLogo(file){
  let task;
  try{
    await prepareLogoDialogs();
    const pdfjs=await pdfLibrary();
    const root=new URL('./pdfjs/',import.meta.url).href;
    task=pdfjs.getDocument({data:new Uint8Array(await readLogoBuffer(file)),cMapUrl:root+'cmaps/',cMapPacked:true,standardFontDataUrl:root+'standard_fonts/',wasmUrl:root+'wasm/',isEvalSupported:false,isOffscreenCanvasSupported:false,isImageDecoderSupported:false});
    const pdf=await task.promise;
    return pdf.numPages===1?await renderPage(pdf,1):await choosePage(pdf);
  }catch(error){
    if(error&&error.name==='PasswordException')throw Error('Ten PDF jest zabezpieczony hasłem. Wgraj kopię bez hasła.');
    console.error('PDF logo import failed:',error);
    throw Error('Nie udało się otworzyć PDF. Sprawdź plik lub wybierz logo w PNG albo JPG.');
  }finally{if(task)await task.destroy()}
}
