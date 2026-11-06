import {response,sign,authorized} from './_auth.mjs';
export default async function(req){
 if(req.method==='GET')return response({authenticated:await authorized(req)});
 if(req.method!=='POST')return response({error:'지원하지 않는 요청입니다.'},405);
 if(!process.env.APP_ACCESS_PIN)return response({error:'서버 PIN 설정이 필요합니다.'},503);
 // PIN 검증은 서버에서만 실행; 잘못된 PIN은 토큰을 발급하지 않습니다.
 let input;try{input=await req.json()}catch{return response({error:'입력 오류'},400)}
 if(typeof input.pin!=='string'||!/^\d{6,12}$/.test(input.pin)||input.pin!==process.env.APP_ACCESS_PIN)return response({error:'PIN이 일치하지 않습니다.'},401);
 return response({token:await sign()});
}
