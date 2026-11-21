import React,{useState} from 'react';
import messages from './messages.json';
export type Language='ko'|'en'|'ru';
let language:Language='ko';
try{const saved=localStorage.getItem('writers18-language');if(saved==='en'||saved==='ru')language=saved;}catch{}
export function setLanguage(value:Language){language=value;try{localStorage.setItem('writers18-language',value)}catch{}if(typeof document!=='undefined')document.documentElement.lang=value;}
export function getLanguage(){return language;}
export function tr(value:string):string{
 if(language==='ko'||!/[가-힣]/.test(value))return value;
 const key=value.trim();let out=(messages as Record<string,{en:string;ru:string}>)[key]?.[language];
 if(!out){const masked=key.replace(/\d[\d,.]*/g,'{n}');const m=(messages as Record<string,{en:string;ru:string}>)[masked]?.[language];if(m){const nums=key.match(/\d[\d,.]*/g)||[];let i=0;out=m.replace(/\{n\}/g,()=>nums[i++]||'');}}
 return out===undefined?value:value.replace(key,out);
}
// Translate only presentation strings; state, field values and original quotations stay intact.
export function h(type:any,props:any,...children:any[]){
 const original=props?.translate==='no'||props?.lang==='ru';
 const next={...props};
 for(const k of ['aria-label','title','placeholder','alt'])if(typeof next[k]==='string')next[k]=tr(next[k]);
 const translate=(v:any):any=>Array.isArray(v)?v.map(translate):typeof v==='string'&&(!original||v==='미기재')?tr(v):v;
 return React.createElement(type,next,...children.map(translate));
}
export function useLanguage(){const [lang,update]=useState(language);return [lang,(v:Language)=>{setLanguage(v);update(v)}] as const;}
