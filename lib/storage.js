import {put,get,list} from '@vercel/blob';
import {hash} from './core.js';
export async function config(){const blob=await get('admin/config.json',{access:'private',useCache:false});if(blob?.statusCode===200)return await new Response(blob.stream).json();return {password:process.env.ADMIN_PASSWORD_HASH,revision:'initial'}}
export async function saveConfig(password){await put('admin/config.json',JSON.stringify({password:hash(password),revision:crypto.randomUUID()}),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60})}
export async function all(prefix){let cursor;const blobs=[];do{const page=await list({prefix,cursor,limit:1000});blobs.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined}while(cursor);return blobs}
export {put};

export async function period(){const blob=await get('admin/statistics-period.json',{access:'private',useCache:false});return blob?.statusCode===200?await new Response(blob.stream).json():{since:null}}
export async function resetStatistics(){const value={since:new Date().toISOString()};await put('admin/statistics-period.json',JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60});return value}
