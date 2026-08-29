const fs=require('fs');
const http=require('http');
const https=require('https');
const {Pool}=require('pg');
const {createClient}=require('redis');
const {createHealthServer}=require('./production_health_server');
const {productionConfig}=require('./production_config');
const {loadSecret}=require('./secret_provider');
const {validateTlsConfig}=require('./tls_policy');
const {PostgresPersistence,RedisPersistence}=require('./production_persistence');

async function connectWithRetry(fn,name,retries=30,delay=2000){
  let last;
  for(let i=1;i<=retries;i++){
    try{return await fn();}
    catch(e){last=e; console.error(`${name} connection attempt ${i}/${retries} failed: ${e.message}`); if(i<retries) await new Promise(r=>setTimeout(r,delay));}
  }
  throw last;
}

async function start(env=process.env){
  const secret=loadSecret({env});
  const runtimeEnv={...env,AUTH_SECRET:secret};
  const cfg=productionConfig(runtimeEnv);
  const tls=validateTlsConfig(runtimeEnv);
  if(runtimeEnv.NODE_ENV==='production'&&!tls.ok) throw new Error(tls.error);

  let pgPool=null, redisClient=null, persistence=null, redisPersistence=null;
  if(cfg.persistenceDriver==='postgres'){
    pgPool=new Pool({connectionString:env.DATABASE_URL, max:Number(env.PG_POOL_MAX||20), idleTimeoutMillis:30000, connectionTimeoutMillis:5000});
    await connectWithRetry(()=>pgPool.query('SELECT 1'),'PostgreSQL');
    persistence=new PostgresPersistence(pgPool);
  }
  if(cfg.redisEnabled){
    redisClient=createClient({url:env.REDIS_URL||'redis://redis:6379'});
    redisClient.on('error',e=>console.error('Redis error:',e.message));
    await connectWithRetry(()=>redisClient.connect(),'Redis');
    await redisClient.ping();
    redisPersistence=new RedisPersistence(redisClient);
  }

  const health=createHealthServer({env:runtimeEnv,persistence,redis:redisPersistence,tls,version:'production'});
  const handler=(req,res)=>health.emit('request',req,res);
  const server=runtimeEnv.NODE_ENV==='production'
    ? https.createServer({cert:fs.readFileSync(env.TLS_CERT_FILE),key:fs.readFileSync(env.TLS_KEY_FILE)},handler)
    : http.createServer(handler);
  const port=Number(env.PORT||3000);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',resolve)});
  console.log(`Hokm Online production service listening on ${port}`);

  const shutdown=async()=>{
    server.close(()=>{});
    if(redisClient?.isOpen) await redisClient.quit();
    if(pgPool) await pgPool.end();
  };
  process.once('SIGTERM',shutdown); process.once('SIGINT',shutdown);
  return {server,pgPool,redisClient,persistence,redisPersistence};
}

if(require.main===module) start().catch(e=>{console.error('STARTUP_FAILED:',e);process.exit(1)});
module.exports={start};
