const { productionConfig } = require('./v37_config');

function checkReadiness({ env = process.env, persistence = null, tls = null, requiredPersistence = true } = {}) {
  const checks = {};
  try { productionConfig(env); checks.config = { ok:true }; }
  catch (e) { checks.config = { ok:false, error:e.message }; }

  checks.persistence = { ok: !requiredPersistence || Boolean(persistence), error: requiredPersistence && !persistence ? 'PERSISTENCE_NOT_CONNECTED' : null };
  checks.tls = { ok: env.NODE_ENV !== 'production' || env.TLS_ENABLED === 'true' || Boolean(tls), error: null };
  if (!checks.tls.ok) checks.tls.error = 'TLS_REQUIRED';

  const ok = Object.values(checks).every(c => c.ok);
  return { ok, status: ok ? 'ready' : 'not_ready', checks, ts: Date.now() };
}

module.exports = { checkReadiness };
