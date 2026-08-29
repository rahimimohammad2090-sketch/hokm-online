const assert=require('assert');
const {productionConfig}=require('./production_config');
const {checkReadiness}=require('./production_readiness');
const {PostgresPersistence,RedisPersistence}=require('./production_persistence');
(async()=>{
 const env={NODE_ENV:'production',AUTH_SECRET:'x'.repeat(48),TLS_ENABLED:'true',TLS_CERT_FILE:'/tmp/c',TLS_KEY_FILE:'/tmp/k',PERSISTENCE_DRIVER:'postgres',REDIS_ENABLED:'true'};
 assert.equal(productionConfig(env).persistenceDriver,'postgres');
 const ready=await checkReadiness({env,persistence:{},redis:{connected:async()=>true},tls:{ok:true}});
 assert.equal(ready.ok,true);
 const queries=[]; const pool={query:async(q,args)=>{queries.push([q,args]); if(q.startsWith('SELECT 1')) return {rows:[{ok:1}]}; if(q.includes('INSERT INTO hokm_events')) return {rows:[{seq:1,type:'PLAY',payload:{a:1},ts:1}]}; if(q.includes('INSERT INTO hokm_snapshots')) return {rows:[]}; if(q.includes('SELECT seq,type,payload,ts FROM hokm_events')) return {rows:[{seq:1,type:'PLAY',payload:{a:1},ts:1}]}; if(q.includes('SELECT seq,state FROM hokm_snapshots')) return {rows:[{seq:1,state:{x:1}}]}; return {rows:[]};}};
 const pg=new PostgresPersistence(pool); await pg.append('m',{seq:1,type:'PLAY',payload:{a:1},ts:1}); assert.equal((await pg.readEvents('m'))[0].seq,1); await pg.saveSnapshot('m',{seq:1,state:{x:1}}); assert.equal((await pg.loadSnapshot('m')).seq,1);
 const redisStore={arr:[],map:new Map(),async lRange(){return this.arr},async rPush(k,v){this.arr.push(v)},async set(k,v){this.map.set(k,v)},async get(k){return this.map.get(k)},async ping(){return 'PONG'}};
 const rp=new RedisPersistence(redisStore); await rp.append('m',{seq:1,type:'PLAY',payload:{a:1}}); assert.equal((await rp.readEvents('m'))[0].seq,1); await rp.saveSnapshot('m',{seq:1,state:{x:1}}); assert.equal((await rp.loadSnapshot('m')).seq,1);
 console.log('production integration tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
