// Hokm Online v24
// احراز هویت و ذخیره‌سازی سبک برای توسعه.
// برای محیط واقعی، PostgreSQL/Redis و Argon2id پیشنهاد می‌شود.

const crypto = require("crypto");

const users = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function validUsername(username) {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function createUser(username, password, displayName) {
  username = normalizeUsername(username);
  if (!validUsername(username)) throw new Error("INVALID_USERNAME");
  if (!validPassword(password)) throw new Error("INVALID_PASSWORD");
  if (users.has(username)) throw new Error("USERNAME_EXISTS");

  const {salt, hash} = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    username,
    displayName: String(displayName || username).slice(0, 40),
    salt,
    passwordHash: hash,
    createdAt: Date.now()
  };
  users.set(username, user);
  return {id:user.id, username:user.username, displayName:user.displayName};
}

function authenticate(username, password) {
  username = normalizeUsername(username);
  const user = users.get(username);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    throw new Error("INVALID_CREDENTIALS");
  }
  return {id:user.id, username:user.username, displayName:user.displayName};
}

module.exports = {
  users, createUser, authenticate, normalizeUsername,
  validUsername, validPassword
};
