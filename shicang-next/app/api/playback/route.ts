import {NextRequest,NextResponse} from 'next/server';
import {player} from '@/lib/player';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{const bvid=req.nextUrl.searchParams.get('bvid')||'';return NextResponse.json(await player.resolve(bvid),{headers:{'Cache-Control':'no-store'}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'暂不可播放'},{status:422});}}
