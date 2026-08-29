# Production Release Runbook

1. Create strong secrets in the platform Secret Manager; mount AUTH_SECRET_FILE, never commit secrets.
2. Provide TLS_CERT_FILE and TLS_KEY_FILE; verify certificate chain before deployment.
3. Start PostgreSQL and Redis with persistent volumes and health checks.
4. Run schema_production.sql and verify application DB connectivity.
5. Enable AOF for Redis and schedule PostgreSQL backups according to backup_plan.json.
6. Deploy one instance, wait for `/ready` = 200, then scale out.
7. Run smoke + load tests against staging before production.
8. Enable centralized audit/log shipping; retain audit data according to policy.
9. Roll back by pinning the previous immutable image tag; never mutate a running image.
10. After rollback, verify `/ready`, event sequence continuity, and replay/recovery tests.
