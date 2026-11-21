import {h} from './i18n';
import React,{useEffect,useRef} from 'react';
export default function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const active=document.activeElement as HTMLElement;ref.current?.showModal();return()=>active?.focus()},[]);
 return <dialog ref={ref} className="simple-modal" onCancel={e=>{e.preventDefault();e.stopPropagation();onClose();}} onKeyDown={e=>e.stopPropagation()}><header><h2>{title}</h2><button aria-label="닫기" onClick={onClose}>×</button></header>{children}</dialog>;
}
