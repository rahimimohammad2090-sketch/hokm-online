// v24 session tokens
// در production باید token در Redis/DB با TTL ذخیره و قابل ابطال باشد.

const crypto = require("crypto");
const sessions = new Map();
const TTL = 24 * 60 * 60 * 1000;

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {user, expiresAt: Date.now() + TTL});
  return token;
}

function getSession(token) {
  const s = sessions.get(String(token || ""));
  if (!s) return null;
  if (s.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return s.user;
}

function revokeSession(token) {
  sessions.delete(String(token || ""));
}

module.exports = {createSession, getSession, revokeSession, sessions};
