import {authorized} from './_auth.mjs';
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default async function(req){
 if(req.method!=='POST')return json({error:'POST만 지원합니다.'},405);
 const key=process.env.OPENAI_API_KEY;
 if(!key||!process.env.APP_ACCESS_PIN)return json({error:'서버 환경변수 OPENAI_API_KEY 및 APP_ACCESS_PIN을 설정하세요.'},503);
 if(!await authorized(req))return json({error:'인증이 만료되었습니다. 새 PIN으로 로그인하세요.'},401);
 try{
 const form=await req.formData();const audio=form.get('audio');
 if(!(audio instanceof File)||audio.size===0||audio.size>20_000_000)return json({error:'녹음 파일이 없거나 20MB를 초과했습니다.'},400);
 const outgoing=new FormData();outgoing.append('file',audio,audio.name||'recording.webm');outgoing.append('model','gpt-4o-mini-transcribe');outgoing.append('language','ko');outgoing.append('prompt','토양정화검증 현장 보링로그 기록. 시료번호, 조사지점, 법면, 바닥면, 굴착, 암반, 토성, 색상, 수분, 취기, 심도, 시료채취.');
 const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:outgoing});const j=await r.json();
 if(!r.ok)return json({error:'음성 변환 오류: '+(j.error?.message||r.status)},502);
 return json({text:j.text||''});
 }catch(e){return json({error:'음성 변환 실패: '+e.message},500)}
}
