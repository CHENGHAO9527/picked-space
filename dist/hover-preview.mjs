export function snapshotCell(shots,ratio){const count=shots.times.length,i=Math.max(0,Math.min(count-1,Math.floor(Math.max(0,Math.min(1,ratio))*count))),per=shots.columns*shots.rows;return {image:shots.images[Math.floor(i/per)],x:i%shots.columns,y:Math.floor(i%per/shots.columns),time:shots.times[i]};}
export function installHoverPreview(container,{enabled=()=>true}={}){
 const cache=new Map();let active=null,timer=null,tick=null,drawCurrent=null,ratio=.08;
 const stop=()=>{clearTimeout(timer);clearInterval(tick);drawCurrent=null;active?.querySelector('.snapshot-preview')?.remove();active?.classList.remove('is-previewing');active=null;};
 async function begin(button){if(active===button||!enabled()||!matchMedia('(hover: hover)').matches)return;stop();active=button;ratio=.08;timer=setTimeout(async()=>{
  const bvid=button.dataset.open?.split(':')[1];if(!bvid)return;
  let shots=cache.get(bvid);if(shots===false)return;
  if(!shots){try{const r=await fetch('api/preview?'+new URLSearchParams({bvid}));if(!r.ok)throw Error();shots=await r.json();cache.set(bvid,shots);}catch{cache.set(bvid,false);return;}}
  if(active!==button||!button.isConnected)return;
  const layer=document.createElement('span');layer.className='snapshot-preview';layer.setAttribute('aria-label','视频快照预览');const image=new Image();image.referrerPolicy='no-referrer';image.alt='';layer.append(image);const label=document.createElement('span');label.className='snapshot-label';layer.append(label);button.append(layer);
  const draw=()=>{if(active!==button)return;const cell=snapshotCell(shots,ratio);if(image.src!==cell.image)image.src=cell.image;image.style.width=shots.columns*100+'%';image.style.height=shots.rows*100+'%';image.style.left=-cell.x*100+'%';image.style.top=-cell.y*100+'%';label.textContent='预览 '+Math.floor(cell.time/60)+':'+String(Math.floor(cell.time%60)).padStart(2,'0');};
  drawCurrent=draw;image.onload=()=>{if(active===button)button.classList.add('is-previewing');};image.onerror=stop;draw();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)tick=setInterval(()=>{ratio=ratio>=.9?.08:ratio+.045;draw();},700);
 },650);}
 container.addEventListener('pointerover',e=>{const button=e.target.closest('.thumb-button');if(button)begin(button);});
 container.addEventListener('pointerout',e=>{if(active&&!active.contains(e.relatedTarget))stop();});
 container.addEventListener('pointermove',e=>{if(active){const rect=active.getBoundingClientRect();ratio=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));drawCurrent?.();}});
 container.addEventListener('focusin',e=>{const button=e.target.closest('.thumb-button');if(button)begin(button);});
 container.addEventListener('focusout',stop);container.addEventListener('click',stop);window.addEventListener('blur',stop);
 return {stop};
}
