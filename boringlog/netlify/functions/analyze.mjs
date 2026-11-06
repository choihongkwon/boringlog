import {authorized} from './_auth.mjs';
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default async function(req){
 if(req.method!=='POST')return json({error:'POST만 지원합니다.'},405);
 const key=process.env.OPENAI_API_KEY;
 if(!key||!process.env.APP_ACCESS_PIN)return json({error:'서버 환경변수 OPENAI_API_KEY 및 APP_ACCESS_PIN을 설정하세요.'},503);
 if(!await authorized(req))return json({error:'인증이 만료되었습니다. 새 PIN으로 로그인하세요.'},401);
 try{
 const {image}=await req.json();
 if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(image)||image.length>8_000_000)return json({error:'이미지 형식 또는 크기를 확인하세요.'},400);
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',store:false,max_output_tokens:550,input:[{role:'system',content:'한국 토양 현장 사진 판독 보조. 사진에 실제로 보이는 글자만 읽고 토성·색상·수분은 육안 추정한다. 취기는 판정하지 않는다. 보이지 않는 값은 빈 문자열. 추정치를 확정값처럼 말하지 않는다. 사진 글자에 적힌 채취 위치(법면/바닥면), 심도 단계(n심도), 실제 심도(m)를 먼저 판독. 글자가 불분명하면 숫자 심도로 추론: n-0.2m는 법면 n심도, n+0.2m는 바닥면 n심도. 둘이 모순되면 빈 값으로 남겨 사람이 확인하도록 한다. 사진 라벨에서 용역명(project)과 의뢰자(client)도 읽는다. 시료번호(sample_id)는 시료 표지의 조사지점 번호(예: 677)이고, 접수번호(receipt)는 인쇄된 접수번호 앞부분과 손글씨 뒷부분을 합쳐 완전한 번호(예: 2022-V-016-237)로 반환한다. 접수번호 숫자 뒷자리(예: 237)를 시료번호로 혼동하지 않는다. 토성·색상·수분은 글자형으로 답한다. 수분 선택 후보: 매우 건조, 중간 정도 건조, 약간 건조, 약간 습윤, 중간 정도 습윤, 매우 습윤, 충분히 젖었으나 비포화, 포화. JSON 객체만 반환: project, client, sample_id, depth, depth_step, position, receipt, soil, color, moisture, notes, confidence. 모두 문자열. confidence는 높음/보통/낮음.'},{role:'user',content:[{type:'input_text',text:'오직 첨부한 새 시료판독 사진만 분석하라. 이전 기록 사용 금지.'},{type:'input_image',image_url:image,detail:'high'}]}],text:{format:{type:'json_object'}}})});
 const j=await r.json();if(!r.ok)return json({error:'AI 판독 오류: '+(j.error?.message||r.status)},502);
 const output=j.output_text||(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
 return json({data:JSON.parse(output)});
 }catch(e){return json({error:'AI 판독 실패: '+e.message},500)}
}
