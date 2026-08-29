const assert=require('assert');
const {ProductionActionGateway}=require('./v37_production_gateway');
const {ReplayGuard}=require('./v37_replay_guard');
const {MemoryPersistence}=require('./production_persistence');
const {SessionManager}=require('./v35_session_manager');
const {AuthService}=require('./v35_auth');
(async()=>{
 const auth=new AuthService({secret:'x'.repeat(64)}); const sessions=new SessionManager();
 const user='load-user'; const sid=sessions.create(user,'player');
 const token=auth.sign({sub:user,sid,role:'player'});
 const gateway=new ProductionActionGateway({auth,sessions,store:new MemoryPersistence(),replay:new ReplayGuard()});
 const n=2000; const t=Date.now(); let ok=0;
 for(let i=1;i<=n;i++){
   const r=await gateway.execute({token,action:{actionId:'action_'+i,seq:i,type:'PLAY_CARD',matchId:'load',card:'AS'},apply:async()=>({done:true})});
   if(r.ok)ok++;
 }
 const ms=Date.now()-t; assert.equal(ok,n); assert.ok(ms<10000,`load test too slow: ${ms}ms`);
 console.log(`load test: PASS (${n} actions, ${ms}ms, ${(n/(ms/1000)).toFixed(1)} actions/s)`);
})().catch(e=>{console.error(e);process.exit(1)});
