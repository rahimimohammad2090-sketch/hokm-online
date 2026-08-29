# v34 Deployment
Production باید از PostgreSQL برای event log و Redis برای coordination/state موقت استفاده کند.
Credentialها داخل source قرار نگیرند و TLS فعال باشد.
Migration: v34_schema.sql
Adapterهای Redis/PostgreSQL در این محیط بدون سرویس واقعی integration-test نشده‌اند؛ تست کامل با MemoryPersistence انجام شده است.
