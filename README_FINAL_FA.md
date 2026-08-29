# حکم آنلاین — بسته نهایی استقرار

این بسته ادامه مستقیم پروژه اصلی تا v37 است و نسخه‌سازی صوری ندارد.

## اجرای سریع روی سرور لینوکس

1. Docker و Docker Compose را روی سرور نصب کنید.
2. این پوشه را روی سرور قرار دهید.
3. اجرا کنید:

```bash
./DEPLOY_NOW.sh
```

اسکریپت Secretها و گواهی آزمایشی را می‌سازد، PostgreSQL و Redis و سرور حکم را بالا می‌آورد و سرویس را Healthcheck می‌کند.

## نکته SSL

گواهی ساخته‌شده برای `localhost` است و برای انتشار عمومی مناسب نیست. برای دامنه واقعی باید گواهی معتبر دامنه جایگزین شود.

## بررسی

- `https://localhost:3000/health`
- `https://localhost:3000/ready`

## توقف

```bash
docker compose -f docker-compose.production.yml down
```

## تست پروژه

```bash
npm test
```
