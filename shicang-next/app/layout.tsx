import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'拾藏 · 私人放映厅',description:'只收你在意的。按自己的注意力，收藏、观看与记下。'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
