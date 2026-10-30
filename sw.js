// Cambie el número de versión si vuelve a grabar audios, para que los móviles descarguen los nuevos
const C='lectori-v5',FONTS=['fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.allSettled(['./','manifest.json','icon-192.png','icon-512.png'].map(u=>c.add(u)))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('lectori-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 // Firebase, Google y cualquier otro dominio ajeno: directo a la red (no se guarda en caché). Solo se guardan las fuentes de Google
 if(u.origin!==location.origin&&!FONTS.includes(u.hostname))return;
 if(u.pathname.includes('/audio/')){e.respondWith(caches.match(r.url).then(h=>h||fetch(r.url).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r.url,y))}return x}).catch(()=>Response.error())));return}
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./'))));return}
 e.respondWith(caches.match(r).then(h=>{const n=fetch(r).then(x=>{if(x.ok||x.type==='opaque'){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x}).catch(()=>h);return h||n}))});
