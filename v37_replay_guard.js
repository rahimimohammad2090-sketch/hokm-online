class ReplayGuard {
  constructor({ maxIdsPerUser = 2048 } = {}) {
    this.maxIdsPerUser = maxIdsPerUser;
    this.state = new Map();
    this.locks = new Map();
  }
  async run(userId, actionId, seq, work) {
    const previous = this.locks.get(userId) || Promise.resolve();
    let release;
    const current = new Promise(resolve => { release = resolve; });
    this.locks.set(userId, current);
    await previous;
    try {
      const s = this.state.get(userId) || { ids: new Set(), lastSeq: 0 };
      if (s.ids.has(actionId)) throw new Error("ACTION_REPLAY");
      if (seq <= s.lastSeq) throw new Error("SEQUENCE_REPLAY");
      const result = await work();
      s.ids.add(actionId);
      s.lastSeq = seq;
      while (s.ids.size > this.maxIdsPerUser) s.ids.delete(s.ids.values().next().value);
      this.state.set(userId, s);
      return result;
    } finally {
      release();
      if (this.locks.get(userId) === current) this.locks.delete(userId);
    }
  }
  clearUser(userId) { this.state.delete(userId); }
  stats(userId) { const s=this.state.get(userId); return s ? {lastSeq:s.lastSeq, rememberedIds:s.ids.size} : {lastSeq:0,rememberedIds:0}; }
}
module.exports = { ReplayGuard };
