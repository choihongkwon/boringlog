const enc=new TextEncoder();
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const b64=u=>btoa(String.fromCharCode(...u)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
const key=async()=>crypto.subtle.importKey('raw',enc.encode(process.env.APP_ACCESS_PIN||''),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
export {response};
export async function sign(){const exp=Date.now()+30*86400000;const body=b64(enc.encode(JSON.stringify({exp,nonce:crypto.randomUUID()})));const sig=b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(),enc.encode(body))));return body+'.'+sig}
export async function authorized(req){if(!process.env.APP_ACCESS_PIN)return false;const h=req.headers.get('authorization')||'';if(!h.startsWith('Bearer '))return false;const token=h.slice(7),parts=token.split('.');if(parts.length!==2)return false;try{const payload=JSON.parse(new TextDecoder().decode(unb64(parts[0])));if(!Number.isFinite(payload.exp)||payload.exp<Date.now()||payload.exp>Date.now()+31*86400000)return false;return await crypto.subtle.verify('HMAC',await key(),unb64(parts[1]),enc.encode(parts[0]))}catch{return false}}
