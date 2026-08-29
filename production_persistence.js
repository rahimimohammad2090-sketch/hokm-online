class MemoryPersistence {
  constructor(){this.events=new Map();this.snapshots=new Map()}
  append(id,event){
    if(!this.events.has(id))this.events.set(id,[]);
    const a=this.events.get(id);
    const existing=a.find(e=>e.seq===event.seq);
    if(existing){ if(existing.type!==event.type || JSON.stringify(existing.payload||{})!==JSON.stringify(event.payload||{})) throw new Error('EVENT_IDEMPOTENCY_CONFLICT'); return {...existing}; }
    if(a.some(e=>e.seq > event.seq)) throw new Error('EVENT_SEQUENCE_OUT_OF_ORDER');
    a.push({...event});
    return {...event};
  }
  readEvents(id){return [...(this.events.get(id)||[])].sort((a,b)=>a.seq-b.seq)}
  saveSnapshot(id,snapshot){this.snapshots.set(id,JSON.parse(JSON.stringify(snapshot)))}
  loadSnapshot(id){const s=this.snapshots.get(id);return s?JSON.parse(JSON.stringify(s)):null}
  connected(){return true}
}

class RedisPersistence {
  constructor(redis){if(!redis)throw new Error('REDIS_REQUIRED');this.redis=redis}
  async append(id,event){
    const key=`hokm:${id}:events`;
    const all=await this.redis.lRange(key,0,-1);
    const existing=all.map(JSON.parse).find(e=>e.seq===event.seq);
    if(existing){ if(existing.type!==event.type || JSON.stringify(existing.payload||{})!==JSON.stringify(event.payload||{})) throw new Error('EVENT_IDEMPOTENCY_CONFLICT'); return existing; }
    const last=all.length?JSON.parse(all[all.length-1]):null;
    if(last && last.seq>=event.seq) throw new Error('EVENT_SEQUENCE_OUT_OF_ORDER');
    await this.redis.rPush(key,JSON.stringify(event));
    return event;
  }
  async readEvents(id){return (await this.redis.lRange(`hokm:${id}:events`,0,-1)).map(JSON.parse)}
  async saveSnapshot(id,snapshot){await this.redis.set(`hokm:${id}:snapshot`,JSON.stringify(snapshot))}
  async loadSnapshot(id){const x=await this.redis.get(`hokm:${id}:snapshot`);return x?JSON.parse(x):null}
  async connected(){return Boolean(await this.redis.ping())}
}

class PostgresPersistence {
  constructor(pool){if(!pool)throw new Error('POSTGRES_POOL_REQUIRED');this.pool=pool}
  async append(id,event){
    const result=await this.pool.query(
      `INSERT INTO hokm_events(match_id,seq,type,payload,ts) VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(match_id,seq) DO NOTHING RETURNING seq,type,payload,ts`,
      [id,event.seq,event.type,event.payload||{},event.ts||Date.now()]
    );
    if(result.rows.length)return result.rows[0];
    const existing=await this.pool.query(`SELECT seq,type,payload,ts FROM hokm_events WHERE match_id=$1 AND seq=$2`,[id,event.seq]);
    if(!existing.rows.length)throw new Error('EVENT_APPEND_FAILED');
    const row=existing.rows[0];
    if(row.type!==event.type || JSON.stringify(row.payload)!==JSON.stringify(event.payload||{})) throw new Error('EVENT_IDEMPOTENCY_CONFLICT');
    return row;
  }
  async readEvents(id){return (await this.pool.query(`SELECT seq,type,payload,ts FROM hokm_events WHERE match_id=$1 ORDER BY seq`,[id])).rows}
  async saveSnapshot(id,snapshot){
    const seq=Number.isInteger(snapshot?.seq)?snapshot.seq:0;
    const state=snapshot?.state ?? snapshot;
    await this.pool.query(`INSERT INTO hokm_snapshots(match_id,seq,state,ts) VALUES($1,$2,$3,$4)
      ON CONFLICT(match_id) DO UPDATE SET seq=EXCLUDED.seq,state=EXCLUDED.state,ts=EXCLUDED.ts`,[id,seq,state,Date.now()]);
  }
  async loadSnapshot(id){
    const row=(await this.pool.query(`SELECT seq,state FROM hokm_snapshots WHERE match_id=$1`,[id])).rows[0];
    return row?{seq:Number(row.seq)||0,state:row.state}:null;
  }
  async connected(){await this.pool.query('SELECT 1');return true}
}
module.exports={MemoryPersistence,RedisPersistence,PostgresPersistence};
