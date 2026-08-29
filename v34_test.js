const assert=require("assert");
const {MemoryPersistence}=require("./v34_persistence");
const {RecoveryManager}=require("./v34_recovery_manager");
(async()=>{
const db=new MemoryPersistence(),rm=new RecoveryManager(db);
await rm.record("m",{seq:1,type:"START",payload:{}});
await rm.record("m",{seq:2,type:"TRUMP",payload:{suit:"H"}});
await rm.record("m",{seq:2,type:"TRUMP",payload:{suit:"H"}}); // duplicate must not duplicate
await rm.checkpoint("m",{score:[1,0],trump:"H"});
const r=await rm.recover("m",(s,e)=>{if(e.type==="SCORE")s.score[0]++},{score:[0,0],trump:null});
assert.deepStrictEqual(r.state,{score:[1,0],trump:"H"});
assert.strictEqual((await db.readEvents("m")).length,2);
console.log("v34 persistence + snapshot + recovery + duplicate-event tests: PASS");
})().catch(e=>{console.error(e);process.exit(1)});
