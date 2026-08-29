const {loadSecret}=require("./secret_provider");
function productionConfig(env=process.env){
  const secret=loadSecret({env});
  if(secret.length<32) throw new Error("AUTH_SECRET_TOO_WEAK");
  const production=env.NODE_ENV==='production';
  if(production && env.TLS_ENABLED!=='true') throw new Error('TLS_REQUIRED');
  if(production && !['postgres','postgresql'].includes(String(env.PERSISTENCE_DRIVER||'').toLowerCase())) throw new Error('POSTGRES_PERSISTENCE_REQUIRED');
  if(production && env.REDIS_ENABLED!=='true') throw new Error('REDIS_REQUIRED');
  return {nodeEnv:env.NODE_ENV||'development',tlsEnabled:env.TLS_ENABLED==='true',persistenceDriver:env.PERSISTENCE_DRIVER||'memory',redisEnabled:env.REDIS_ENABLED==='true'};
}
module.exports={productionConfig};
