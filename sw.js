/* Built separately: never concatenate this worker into the application bundle. */
'use strict';
const ROOT=new URL('./',self.location.href),PREFIX='ba-shell-'+encodeURIComponent(ROOT.pathname)+'-',CACHE=PREFIX+'41ecfdea74a870ca2979',FILES={"index.html": "38f7ed1e1fdbd64adc3e1ae476393b31e800680af7c6725c0df3338e08203ff5", "manifest.webmanifest": "24183ccdaf123686805b529efaef8a8a766fd94853566e5cc9e33b6bf99abcca", "packs/catalog.json": "76ed320ae4f3cfe678f88014c8cbe9d91fedcf6ac90ad51ad25a4a5a4f2cd80d", "icons/bookmark-192.png": "0da186bb4d842fe7dfc6757abc70efe735a742f2a56e8d3c8d566a42cbf1a067", "icons/bookmark-512.png": "776bfb5278682ace1d7cdca894e8ace13220f378c9dd0b8e1bd548d8cf9685c6"};
const url=path=>new URL(path,ROOT).href;
const sha=async buffer=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),n=>n.toString(16).padStart(2,'0')).join('');
self.addEventListener('install',event=>event.waitUntil((async()=>{
  try{const cache=await caches.open(CACHE);
    for(const [path,hash] of Object.entries(FILES)){const r=await fetch(url(path),{cache:'reload',redirect:'error'});if(!r.ok||await sha(await r.clone().arrayBuffer())!==hash)throw Error('SHELL_INTEGRITY');await cache.put(url(path),r);}
    const worker=await fetch(self.location.href,{cache:'reload'});if(!worker.ok)throw Error('WORKER_CACHE');await cache.put(url('sw.js'),worker);
  }catch(error){await caches.delete(CACHE);throw error;}
  // Updates wait; only the user's reload action sends ACTIVATE_UPDATE.
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  const request=event.request,u=new URL(request.url);if(request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
  const rel=u.pathname.slice(ROOT.pathname.length);
  if(request.mode==='navigate'&&(rel===''||rel==='index.html')){event.respondWith((async()=>{const cached=await (await caches.open(CACHE)).match(url('index.html'));return cached||fetch(request);})());return;}
  if(rel==='packs/catalog.json'){event.respondWith((async()=>{try{const r=await fetch(request);if(r.ok)return r;}catch(_){}return (await (await caches.open(CACHE)).match(url(rel)))||Response.error();})());return;}
  if(Object.hasOwn(FILES,rel)||rel==='sw.js'){event.respondWith((async()=>await (await caches.open(CACHE)).match(url(rel))||fetch(request))());return;}
  if(rel.startsWith('packs/')&&request.cache!=='no-cache')event.respondWith((async()=>{
    // Unfinished downloads are deliberately excluded. URLs remain scoped to this app.
    for(const name of await caches.keys())if(name.startsWith('ba-book-v1-')){const cache=await caches.open(name),marker=await cache.match(url(rel.split('/').slice(0,2).join('/')+'/_complete'));if(marker){const r=await cache.match(request);if(r)return r;}}
    return fetch(request);
  })());
});
