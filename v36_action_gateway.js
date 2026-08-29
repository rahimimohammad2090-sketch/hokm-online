const crypto = require("crypto");
const { can, assertSeatOwner } = require("./v35_authorization");
const { validateAction, sanitizeString } = require("./v35_security");

class SecureActionGateway {
  constructor({ auth, sessions, store = null, maxPayloadBytes = 4096 } = {}) {
    if (!auth || !sessions) throw new Error("GATEWAY_DEPENDENCY_MISSING");
    this.auth = auth;
    this.sessions = sessions;
    this.store = store;
    this.maxPayloadBytes = maxPayloadBytes;
    this.seen = new Map(); // userId -> Set(actionId)
    this.lastSeq = new Map(); // userId -> last accepted sequence
  }

  authenticate(token, now = Date.now()) {
    const p = this.auth.verify(token, now);
    if (!p) throw new Error("AUTH_INVALID");
    const session = this.sessions.get(p.sid, now);
    if (!session || session.userId !== p.sub || session.role !== p.role) {
      throw new Error("SESSION_INVALID");
    }
    return { userId: session.userId, role: session.role };
  }

  authorize(ctx, action) {
    if (!can(ctx.role, "match:play")) throw new Error("PERMISSION_DENIED");
    if (action.seat && action.seat.userId) assertSeatOwner(action.seat, ctx.userId);
  }

  validatePayload(action) {
    if (!validateAction(action)) throw new Error("ACTION_INVALID");
    const bytes = Buffer.byteLength(JSON.stringify(action), "utf8");
    if (bytes > this.maxPayloadBytes) throw new Error("PAYLOAD_TOO_LARGE");
    const clean = { ...action };
    if (clean.roomCode !== undefined) clean.roomCode = sanitizeString(clean.roomCode, 32).toUpperCase();
    if (clean.card !== undefined) clean.card = sanitizeString(clean.card, 32);
    return clean;
  }

  checkReplay(ctx, action) {
    if (!this.seen.has(ctx.userId)) this.seen.set(ctx.userId, new Set());
    const set = this.seen.get(ctx.userId);
    if (set.has(action.actionId)) throw new Error("ACTION_REPLAY");
    const previous = this.lastSeq.get(ctx.userId) || 0;
    if (action.seq <= previous) throw new Error("SEQUENCE_REPLAY");
    set.add(action.actionId);
    this.lastSeq.set(ctx.userId, action.seq);
  }

  async execute({ token, action, now = Date.now(), apply }) {
    let ctx;
    try {
      ctx = this.authenticate(token, now);
      const clean = this.validatePayload(action);
      this.authorize(ctx, clean);
      this.checkReplay(ctx, clean);

      const result = await apply({ ...clean, userId: ctx.userId });
      if (this.store) {
        await this.store.append(clean.matchId || clean.roomCode || "unknown", {
          seq: clean.seq,
          type: clean.type,
          payload: { userId: ctx.userId, actionId: clean.actionId, result },
          ts: now
        });
      }
      return { ok: true, userId: ctx.userId, result };
    } catch (error) {
      return { ok: false, error: error.message || "ACTION_REJECTED" };
    }
  }
}

function issueSessionToken({ auth, sessions, userId, role = "player" }) {
  const sid = sessions.create(userId, role);
  return auth.sign({ sub: userId, role, sid });
}

module.exports = { SecureActionGateway, issueSessionToken };
