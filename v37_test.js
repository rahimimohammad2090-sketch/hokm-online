const assert=require("assert");
const {AuthService}=require("./v35_auth");
const {SessionManager}=require("./v35_session_manager");
const {MemoryPersistence}=require("./v34_persistence");
const {RateLimiter}=require("./v33_rate_limiter");
const {ProductionActionGateway}=require("./v37_production_gateway");
const {FinalRealtimeAdapter}=require("./v37_adapter");
const {productionConfig}=require("./v37_config");

(async()=>{
 const now=Date.now(), secret="x".repeat(48);
 assert.deepStrictEqual(productionConfig({AUTH_SECRET:secret,NODE_ENV:"production",TLS_ENABLED:"true",PERSISTENCE_DRIVER:"postgres",REDIS_ENABLED:"true"}).tlsEnabled,true);
 assert.throws(()=>productionConfig({AUTH_SECRET:secret,NODE_ENV:"production",TLS_ENABLED:"false",PERSISTENCE_DRIVER:"postgres",REDIS_ENABLED:"true"}),/TLS_REQUIRED/);
 const auth=new AuthService({secret,ttlMs:10000}), sessions=new SessionManager({ttlMs:10000}), store=new MemoryPersistence();
 const token=require("./v36_action_gateway").issueSessionToken({auth,sessions,userId:"u1",role:"player"});
 const gw=new ProductionActionGateway({auth,sessions,store,rateLimiter:new RateLimiter({limit:10,windowMs:1000})});
 let applied=0;
 const a={actionId:"CARDPLAY_37_01",seq:1,type:"CARD_PLAYED",matchId:"M37",roomCode:" ab12cd ",card:" AH ",seat:{userId:"u1"}};
 let r=await gw.execute({token,action:a,now,apply:async x=>{applied++;return {ok:true,card:x.card}}});
 assert.equal(r.ok,true); assert.equal(applied,1); assert.equal(r.result.card,"AH"); assert.equal(store.readEvents("M37").length,1);
 r=await gw.execute({token,action:a,now:now+1,apply:async()=>({})}); assert.equal(r.error,"ACTION_REPLAY");
 r=await gw.execute({token,action:{...a,actionId:"CARDPLAY_37_02",seq:1},now:now+2,apply:async()=>({})}); assert.equal(r.error,"SEQUENCE_REPLAY");
 // Failed apply must not consume the action sequence.
 const failing={...a,actionId:"CARDPLAY_37_03",seq:2};
 r=await gw.execute({token,action:failing,now:now+3,apply:async()=>{throw new Error("GAME_REJECTED")}}); assert.equal(r.error,"GAME_REJECTED");
 r=await gw.execute({token,action:{...failing,actionId:"CARDPLAY_37_04"},now:now+4,apply:async()=>({ok:true})}); assert.equal(r.ok,true);
 // Concurrent actions are serialized per user.
 const order=[];
 const p1=gw.execute({token,action:{...a,actionId:"CARDPLAY_37_05",seq:3},now:now+5,apply:async()=>{order.push("a");await new Promise(x=>setTimeout(x,10));order.push("a2");return {}}});
 const p2=gw.execute({token,action:{...a,actionId:"CARDPLAY_37_06",seq:4},now:now+6,apply:async()=>{order.push("b");return {}}});
 await Promise.all([p1,p2]); assert.deepStrictEqual(order,["a","a2","b"]);
 const spectator=require("./v36_action_gateway").issueSessionToken({auth,sessions,userId:"u2",role:"spectator"});
 r=await gw.execute({token:spectator,action:{...a,actionId:"CARDPLAY_37_07",seq:1,seat:{userId:"u2"}},now:now+7,apply:async()=>({})}); assert.equal(r.error,"PERMISSION_DENIED");
 const adapter=new FinalRealtimeAdapter({auth,sessions});
 r=await adapter.handle({token,action:{...a,actionId:"CARDPLAY_37_08",seq:5},now:now+8,apply:async()=>({ok:1})});
 assert.equal(r.ok,true); assert.equal(adapter.audit.counts().ACCEPT,1); assert.equal(adapter.audit.list()[0].latencyMs>=0,true);
 console.log("v37 production hardening + transactional replay + concurrency + config + audit tests: PASS");
})().catch(e=>{console.error(e);process.exit(1)});
