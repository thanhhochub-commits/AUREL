(function(){
  'use strict';
  const DB_NAME='aurel-browser-data-only-v4';
  let opening=null;
  function open(){
    if(!opening)opening=new Promise(function(resolve,reject){
      if(!window.indexedDB){reject(new Error('Trinh duyet khong ho tro luu tru du lieu cuc bo.'));return;}
      const r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=function(){
        const db=r.result;
        if(!db.objectStoreNames.contains('records'))db.createObjectStore('records');
        if(!db.objectStoreNames.contains('pdfs'))db.createObjectStore('pdfs',{keyPath:'name'});
      };
      r.onsuccess=function(){resolve(r.result)};
      r.onerror=function(){reject(r.error||new Error('Khong mo duoc IndexedDB'))};
      r.onblocked=function(){reject(new Error('Luu tru cuc bo dang bi khoa'))};
    }).catch(function(e){opening=null;throw e});
    return opening;
  }
  async function transaction(stores,mode,action){
    const db=await open();
    return new Promise(function(resolve,reject){
      const t=db.transaction(stores,mode);
      let result;
      t.oncomplete=function(){resolve(result)};
      t.onerror=function(){reject(t.error||new Error('Luu tru cuc bo that bai'))};
      t.onabort=function(){reject(t.error||new Error('Giao dich luu tru bi huy'))};
      try {
        const req=action(t);
        if(req){
          req.onsuccess=function(){result=req.result};
          req.onerror=function(){try{t.abort()}catch(_){}};
        }
      }catch(e){try{t.abort()}catch(_){}reject(e)}
    });
  }
  async function rows(){
    const value=await transaction(['records'],'readonly',t=>t.objectStore('records').get('rows'));
    if(value==null)return [];
    if(!Array.isArray(value))throw new Error('Du lieu da luu khong hop le');
    return value;
  }
  async function saveRows(value){
    if(!Array.isArray(value))throw new Error('Du lieu de luu khong hop le');
    await transaction(['records'],'readwrite',t=>t.objectStore('records').put(value,'rows'));
  }
  async function savePdf(file){
    if(!file || typeof file.name!=='string' || !/\.pdf$/i.test(file.name))return;
    await transaction(['pdfs'],'readwrite',t=>t.objectStore('pdfs').put({
      name:file.name,blob:file,lastModified:file.lastModified||0
    }));
  }
  async function pdfs(){
    return await transaction(['pdfs'],'readonly',t=>t.objectStore('pdfs').getAll())||[];
  }
  async function clear(){
    await transaction(['records','pdfs'],'readwrite',function(t){
      t.objectStore('records').clear();
      t.objectStore('pdfs').clear();
    });
  }
  async function restore(upload,request){
    const originals=await pdfs();
    for(let i=0;i<originals.length;i++){
      const source=originals[i];
      if(!source || !source.name || !source.blob)throw new Error('Tep PDF cuc bo khong hop le');
      const file=new File([source.blob],source.name,{
        type:'application/pdf',lastModified:source.lastModified||Date.now()
      });
      await upload(file,true,null,i+1,originals.length);
    }
    const saved=await rows();
    return await request('api/local/restore',{rows:saved},120000);
  }
  window.AURELLocal={open,rows,saveRows,savePdf,pdfs,clear,restore};
})();
