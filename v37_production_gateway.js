const { can, assertSeatOwner } = require("./v35_authorization");
const { validateAction, sanitizeString } = require("./v35_security");
const { ReplayGuard } = require("./v37_replay_guard");

class ProductionActionGateway {
  constructor({ auth, sessions, store = null, audit = null, rateLimiter = null, maxPayloadBytes = 4096, replay = new ReplayGuard() } = {}) {
    if (!auth || !sessions) throw new Error("GATEWAY_DEPENDENCY_MISSING");
    this.auth = auth; this.sessions = sessions; this.store = store; this.audit = audit;
    this.rateLimiter = rateLimiter; this.maxPayloadBytes = maxPayloadBytes; this.replay = replay;
  }
  authenticate(token, now = Date.now()) {
    const p = this.auth.verify(token, now);
    if (!p) throw new Error("AUTH_INVALID");
    const s = this.sessions.get(p.sid, now);
    if (!s || s.userId !== p.sub || s.role !== p.role) throw new Error("SESSION_INVALID");
    return { userId:s.userId, role:s.role, sessionId:p.sid };
  }
  validate(action) {
    if (!validateAction(action)) throw new Error("ACTION_INVALID");
    const bytes = Buffer.byteLength(JSON.stringify(action), "utf8");
    if (bytes > this.maxPayloadBytes) throw new Error("PAYLOAD_TOO_LARGE");
    const clean = { ...action };
    for (const k of ["roomCode","card","matchId"]) if (clean[k] !== undefined) clean[k] = sanitizeString(clean[k], 64);
    return clean;
  }
  authorize(ctx, action) {
    if (!can(ctx.role, "match:play")) throw new Error("PERMISSION_DENIED");
    if (action.seat && action.seat.userId) assertSeatOwner(action.seat, ctx.userId);
  }
  async execute({ token, action, now = Date.now(), apply }) {
    if (typeof apply !== "function") return { ok:false, error:"APPLY_HANDLER_MISSING" };
    let ctx, clean;
    try {
      ctx = this.authenticate(token, now);
      clean = this.validate(action);
      this.authorize(ctx, clean);
      if (this.rateLimiter && !this.rateLimiter.allow(ctx.userId, now)) throw new Error("RATE_LIMITED");
      const result = await this.replay.run(ctx.userId, clean.actionId, clean.seq, async () => {
        const applied = await apply({ ...clean, userId:ctx.userId });
        if (this.store) {
          try {
            await this.store.append(clean.matchId || clean.roomCode || "unknown", {
              seq:clean.seq, type:clean.type,
              payload:{ userId:ctx.userId, actionId:clean.actionId, result:applied }, ts:now
            });
          } catch (e) {
            if (typeof applied?.rollback === "function") await applied.rollback();
            throw new Error("PERSISTENCE_ERROR");
          }
        }
        return applied;
      });
      return { ok:true, userId:ctx.userId, sessionId:ctx.sessionId, result };
    } catch (e) {
      return { ok:false, userId:ctx?.userId || null, error:e.message || "ACTION_REJECTED" };
    }
  }
}
module.exports = { ProductionActionGateway };
