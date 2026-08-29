const assert=require('assert');
const {checkReadiness}=require('./production_readiness');
(async()=>{
 const base={AUTH_SECRET:'x'.repeat(48),NODE_ENV:'production',TLS_ENABLED:'true',PERSISTENCE_DRIVER:'postgres',REDIS_ENABLED:'true'};
 let r=await checkReadiness({env:base,persistence:{connected:true},redis:{ping:async()=> 'PONG'}});
 assert.equal(r.ok,true);
 r=await checkReadiness({env:base,persistence:null,redis:{ping:async()=> 'PONG'}}); assert.equal(r.ok,false); assert.equal(r.checks.persistence.error,'PERSISTENCE_NOT_CONNECTED');
 r=await checkReadiness({env:{...base,REDIS_ENABLED:'false'},persistence:{connected:true},redis:{ping:async()=> 'PONG'}}); assert.equal(r.ok,false); assert.equal(r.checks.config.error,'REDIS_REQUIRED');
 r=await checkReadiness({env:{...base},persistence:{connected:true},redis:null}); assert.equal(r.ok,false); assert.equal(r.checks.redis.error,'REDIS_NOT_CONNECTED');
 console.log('production readiness readiness policy tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
