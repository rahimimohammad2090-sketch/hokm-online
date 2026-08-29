class RecoveryManager{
constructor(store){this.store=store}
async record(id,event){return this.store.append(id,event)}
async checkpoint(id,state){return this.store.saveSnapshot(id,state)}
async recover(id,applyEvent,initialState={}){
const snap=await this.store.loadSnapshot(id);const state=snap?structuredClone(snap):structuredClone(initialState)
for(const e of await this.store.readEvents(id))applyEvent(state,e)
return {state}
}}
module.exports={RecoveryManager};
