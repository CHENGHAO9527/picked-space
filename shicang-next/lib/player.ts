import {createPlaybackService} from './playback.mjs';
import {limited} from './bili';
const globalPlayer=globalThis as unknown as {shicangPlayer?:ReturnType<typeof createPlaybackService>};
export const player=globalPlayer.shicangPlayer??createPlaybackService({fetcher:((url,init)=>limited(()=>fetch(url,init))) as typeof fetch});
globalPlayer.shicangPlayer=player;
