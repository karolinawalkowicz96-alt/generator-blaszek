// Shared by PDF page selection and image/PDF cropping. Loaded only for logos.
let dialogLibrary;
export async function prepareLogoDialogs(){
  if(typeof HTMLDialogElement!=='undefined'&&HTMLDialogElement.prototype.showModal)return;
  if(!dialogLibrary)dialogLibrary=import('./pdfjs/dialog/dialog-polyfill.esm.js').catch(error=>{dialogLibrary=null;throw error});
  const {default:polyfill}=await dialogLibrary;
  if(!document.querySelector('[data-logo-dialog-css]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./pdfjs/dialog/dialog-polyfill.css',import.meta.url).href;css.setAttribute('data-logo-dialog-css','');document.head.append(css);
  }
  // Register when a dialog is created, before showModal is called.
  window.logoDialogPolyfill=polyfill;
}
export function readLogoBuffer(file){
  if(typeof file.arrayBuffer==='function')return file.arrayBuffer();
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error||Error('Nie udało się odczytać pliku.'));
    reader.onabort=()=>reject(Error('Odczyt pliku został przerwany.'));
    reader.readAsArrayBuffer(file);
  });
}
export function loadLogoImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Nie udało się odczytać obrazu.'));img.src=src;
  });
}
