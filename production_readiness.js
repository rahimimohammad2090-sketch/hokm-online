const { productionConfig } = require('./production_config');
async function checkReadiness({env=process.env,persistence=null,redis=null,tls=null,requiredPersistence=true}={}){
  const checks={};
  try { productionConfig(env); checks.config={ok:true}; } catch(e){checks.config={ok:false,error:e.message};}
  const persistenceOk=!requiredPersistence||Boolean(persistence);
  checks.persistence={ok:persistenceOk,error:persistenceOk?null:'PERSISTENCE_NOT_CONNECTED'};
  const redisRequired=env.NODE_ENV==='production';
  let redisOk=!redisRequired;
  if(redisRequired){try{redisOk=Boolean(redis && (typeof redis.connected==='function'?await redis.connected():await redis.ping()));}catch(e){redisOk=false;}}
  checks.redis={ok:redisOk,error:redisOk?null:'REDIS_NOT_CONNECTED'};
  checks.tls={ok:env.NODE_ENV!=='production'||env.TLS_ENABLED==='true'||Boolean(tls),error:null};
  if(!checks.tls.ok)checks.tls.error='TLS_REQUIRED';
  const ok=Object.values(checks).every(c=>c.ok);
  return {ok,status:ok?'ready':'not_ready',checks,ts:Date.now()};
}
module.exports={checkReadiness};
