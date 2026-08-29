# Production Deployment — Hokm Online

این فایل ادامه مستقیم Release Candidate موجود است و نسخه صوری جدیدی ایجاد نمی‌کند.

## اجزای اجباری Production
- PostgreSQL برای event log و snapshot
- Redis برای coordination/state موقت
- TLS واقعی در reverse proxy یا Node HTTPS
- AUTH_SECRET حداقل ۳۲ کاراکتر و خارج از source
- backup برای PostgreSQL و persistence مناسب Redis

## متغیرهای محیطی
- `NODE_ENV=production`
- `AUTH_SECRET=<secret-from-secret-manager>`
- `TLS_ENABLED=true`
- `PERSISTENCE_DRIVER=postgres`
- `REDIS_ENABLED=true`
- `POSTGRES_PASSWORD=<secret>`

## تست قبل از انتشار
`npm test`

سرویس فقط زمانی Ready محسوب می‌شود که configuration، persistence، Redis و TLS همگی سالم باشند.
