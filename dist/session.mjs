// A time budget is a hard cap. One video per creator keeps a session varied.
export function planSession(videos,{minutes=30,prefs={},random=Math.random}={}){
 const budget=Math.max(1,Math.min(120,Number(minutes)||30))*60,slots=Math.floor(budget/5),groups=new Map();
 const unseen=videos.filter(v=>!prefs[v.key]?.watched&&Number.isFinite(v.duration)&&v.duration>0&&v.duration<=budget);
 for(const v of unseen.map(v=>({v,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.v)){
  const key=v.creatorKey||v.author||v.key;if(!groups.has(key))groups.set(key,[]);if(groups.get(key).length<4)groups.get(key).push(v);
 }
 let dp=new Map([[0,{score:0,items:[],used:0}]]);
 for(const group of groups.values()){
  const next=new Map(dp);
  for(const [slot,old] of dp)for(const v of group){
   const cost=Math.ceil(v.duration/5),at=slot+cost;if(at>slots||old.items.length>=6)continue;
   const score=old.score+v.duration+(v.sources?.some(s=>s==='favorites'||s==='watchlater')?25:0)+(prefs[v.key]?.starred?30:0);
   if(!next.has(at)||score>next.get(at).score)next.set(at,{score,used:old.used+v.duration,items:[...old.items,v]});
  }dp=next;
 }
 const best=[...dp.values()].sort((a,b)=>b.score-a.score)[0];return {videos:best.items,total:best.used,budget};
}
