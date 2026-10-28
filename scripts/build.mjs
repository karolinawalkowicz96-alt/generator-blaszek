import './prepare-pdfjs.mjs';
import {cp,mkdir,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const file of ['assets','index.html','admin.html','LICENCJA-CZCIONKI.txt'])await cp(new URL(file,root),new URL(file,out),{recursive:true});
