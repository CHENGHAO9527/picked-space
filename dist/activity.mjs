const day=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value?d:null;};
export function creatorActivity(creator,{months=12,asOf=new Date().toISOString().slice(0,10)}={}){
 const latest=day(creator?.lastUploadAt),recent=day(creator?.recentVideoAfter),today=day(asOf);if(!today||latest&&latest>today)return 'unknown';
 const cutoff=new Date(today),date=cutoff.getUTCDate();cutoff.setUTCDate(1);cutoff.setUTCMonth(cutoff.getUTCMonth()-months);cutoff.setUTCDate(Math.min(date,new Date(Date.UTC(cutoff.getUTCFullYear(),cutoff.getUTCMonth()+1,0)).getUTCDate()));
 if(recent&&recent<=today&&recent>=cutoff)return 'active';if(!latest)return 'unknown';return latest<cutoff?'inactive':'active';
}
export function curateVideos(videos,roster=[],options={}){
 if(options.showInactive)return videos;const inactive=new Set(roster.filter(c=>creatorActivity(c,options)==='inactive'||['unavailable','no-public-uploads'].includes(c.profileStatus)).map(c=>c.id));
 return videos.flatMap(v=>{const ids=[...new Set([v.creatorId,...(v.contributors||[])].filter(Boolean))];
  if(!v.sources.includes('following')||!ids.length||!ids.every(id=>inactive.has(id)))return [v];
  const sources=v.sources.filter(s=>s!=='following');return sources.length?[{...v,sources}]:[];
 });
}
