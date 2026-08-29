# عملیات Production

- پیش‌نیاز: Docker + Docker Compose + OpenSSL + curl
- قبل از استقرار: `ops/preflight.sh`
- استقرار: `./DEPLOY_NOW.sh`
- بررسی سرویس: `ops/smoke_production.sh`
- پشتیبان PostgreSQL: `ops/backup_postgres.sh`
- بازیابی: `ops/restore_postgres.sh <backup.dump>`
- تست کامل کد: `npm test`

برای انتشار عمومی، certificate مربوط به دامنه واقعی باید در `secrets/tls_cert.pem` و `secrets/tls_key.pem` قرار گیرد. گواهی localhost فقط برای تست است.
