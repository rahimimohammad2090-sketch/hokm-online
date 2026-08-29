const assert = require("assert");
const { AuthService } = require("./v35_auth");
const { SessionManager } = require("./v35_session_manager");
const { MemoryPersistence } = require("./v34_persistence");
const { SecureActionGateway, issueSessionToken } = require("./v36_action_gateway");
const { RealtimeSecureAdapter } = require("./v36_realtime_adapter");

(async () => {
  const now = Date.now();
  const auth = new AuthService({ secret: "s".repeat(48), ttlMs: 5000 });
  const sessions = new SessionManager({ ttlMs: 5000 });
  const store = new MemoryPersistence();
  const gateway = new SecureActionGateway({ auth, sessions, store });

  const token = issueSessionToken({ auth, sessions, userId: "u1", role: "player" });
  const action = {
    actionId: "CARDPLAY_01",
    seq: 1,
    type: "CARD_PLAYED",
    matchId: "M1",
    roomCode: " ab12cd ",
    card: " AH ",
    seat: { userId: "u1" }
  };

  const applied = [];
  let r = await gateway.execute({
    token, action, now,
    apply: async a => { applied.push(a); return { accepted: true }; }
  });
  assert.equal(r.ok, true);
  assert.equal(applied[0].roomCode, "AB12CD");
  assert.equal(applied[0].card, "AH");
  assert.equal(store.readEvents("M1").length, 1);

  r = await gateway.execute({ token, action, now: now + 1, apply: async () => ({}) });
  assert.equal(r.error, "ACTION_REPLAY");

  r = await gateway.execute({
    token,
    action: { ...action, actionId: "CARDPLAY_02", seq: 1 },
    now: now + 2,
    apply: async () => ({})
  });
  assert.equal(r.error, "SEQUENCE_REPLAY");

  const spectatorToken = issueSessionToken({ auth, sessions, userId: "u2", role: "spectator" });
  r = await gateway.execute({
    token: spectatorToken,
    action: { ...action, actionId: "CARDPLAY_03", seq: 2, seat: { userId: "u2" } },
    now: now + 3,
    apply: async () => ({})
  });
  assert.equal(r.error, "PERMISSION_DENIED");

  const badToken = token.slice(0, -1) + (token.endsWith("x") ? "y" : "x");
  r = await gateway.execute({
    token: badToken,
    action: { ...action, actionId: "CARDPLAY_04", seq: 2 },
    now: now + 4,
    apply: async () => ({})
  });
  assert.equal(r.error, "AUTH_INVALID");

  const adapter = new RealtimeSecureAdapter({ auth, sessions });
  r = await adapter.handle({
    token,
    action: { ...action, actionId: "CARDPLAY_05", seq: 2 },
    now: now + 5,
    apply: async () => ({ ok: 1 })
  });
  assert.equal(r.ok, true);
  assert.equal(adapter.audit.list()[0].status, "ACCEPT");

  console.log("v36 secure gateway + realtime adapter + replay + RBAC tests: PASS");
})().catch(e => { console.error(e); process.exit(1); });
