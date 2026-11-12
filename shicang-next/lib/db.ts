import {DatabaseSync} from 'node:sqlite';
import {drizzle} from 'drizzle-orm/node-sqlite';
import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
import {eq} from 'drizzle-orm';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
export const documents=sqliteTable('documents',{key:text().primaryKey(),value:text().notNull(),updatedAt:integer().notNull()});
export const cache=sqliteTable('api_cache',{key:text().primaryKey(),value:text().notNull(),expires:integer().notNull()});
export const videosTable=sqliteTable('videos',{bvid:text().primaryKey(),value:text().notNull()});
const globalDB=globalThis as unknown as {shicangDB?:ReturnType<typeof connect>};
function connect(){
 const folder=path.resolve('.local');mkdirSync(folder,{recursive:true});
 const sqlite=new DatabaseSync(path.join(folder,'shicang.sqlite'));sqlite.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS documents (key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS api_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS videos (bvid TEXT PRIMARY KEY, value TEXT NOT NULL);');
 return drizzle({client:sqlite});
}
// Importing a route during next build must not open the personal database in build workers.
export const db=new Proxy({} as ReturnType<typeof connect>,{get(_target,key){const live=globalDB.shicangDB??connect();globalDB.shicangDB=live;const value=Reflect.get(live,key);return typeof value==='function'?value.bind(live):value;}});
export function getDoc<T>(key:string,fallback:T):T{const row=db.select().from(documents).where(eq(documents.key,key)).get();return row?JSON.parse(row.value):fallback;}
export function putDoc(key:string,value:unknown){db.insert(documents).values({key,value:JSON.stringify(value),updatedAt:Date.now()}).onConflictDoUpdate({target:documents.key,set:{value:JSON.stringify(value),updatedAt:Date.now()}}).run();}
export function getCache(key:string){const row=db.select().from(cache).where(eq(cache.key,key)).get();return row&&row.expires>Date.now()?JSON.parse(row.value):null;}
export function putCache(key:string,value:unknown,ttl:number){db.insert(cache).values({key,value:JSON.stringify(value),expires:Date.now()+ttl}).onConflictDoUpdate({target:cache.key,set:{value:JSON.stringify(value),expires:Date.now()+ttl}}).run();}
