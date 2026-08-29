const { ProductionActionGateway } = require("./v37_production_gateway");
const { ProductionAuditLog } = require("./v37_audit");
class FinalRealtimeAdapter {
  constructor(opts={}) { this.audit=opts.audit||new ProductionAuditLog(); this.gateway=new ProductionActionGateway({...opts,audit:this.audit}); }
  async handle({token,action,apply,now=Date.now()}) {
    const started=Date.now();
    const result=await this.gateway.execute({token,action,apply,now});
    this.audit.record({userId:result.userId||null,actionId:action?.actionId||null,type:action?.type||null,status:result.ok?"ACCEPT":"REJECT",error:result.ok?null:result.error,ts:now,latencyMs:Date.now()-started});
    return result;
  }
}
module.exports={FinalRealtimeAdapter};
