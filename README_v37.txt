Hokm Online v37 — Production Hardening & Release Candidate

v37 آخرین لایه سخت‌سازی روی v36 است و برای تبدیل Secure Action Gateway به یک Release Candidate طراحی شده است.

موارد اصلی:
- ReplayGuard با قفل per-user برای جلوگیری از race condition در actionهای همزمان
- commit شدن actionId/sequence فقط پس از موفقیت apply
- حفظ sequence در صورت شکست game action و امکان retry صحیح
- rate limiting v33 در مسیر اجرای action
- کنترل خطای persistence و rollback اختیاری
- audit تولیدی با latency و شمارنده وضعیت‌ها
- production configuration check برای AUTH_SECRET و TLS
- تست concurrency، replay، retry، RBAC، persistence، audit و production config
- تمام قابلیت‌های v34، v35 و v36 حفظ شده‌اند.

وضعیت: Release Candidate / آماده برای تست نهایی محیط واقعی. راه‌اندازی production منوط به اتصال Secret Manager، TLS واقعی و persistence واقعی است.

تکمیل تکمیلی پس از RC:
- health endpoint و readiness endpoint به‌صورت ماژول مستقل اضافه شد.
- readiness در production بدون persistence متصل یا TLS معتبر، Ready اعلام نمی‌شود.
- تست‌های health/readiness اضافه و با تمام تست‌های v30 تا v37 اجرا شدند.
- این تغییرات بخشی از همان پروژه اصلی هستند و نسخه صوری جدید ایجاد نشده است.

تکمیل سخت‌سازی ادامه پروژه (بدون ایجاد نسخه صوری):
- Recovery اکنون checkpoint sequence را نگه می‌دارد و eventهای قبل/همان checkpoint را دوباره اجرا نمی‌کند.
- persistence تولیدی برای Postgres/Redis با idempotency و کنترل conflict تقویت شد.
- snapshot دارای seq مستقل شد.
- readiness در production علاوه بر TLS و persistence، اتصال Redis را نیز بررسی می‌کند.
- production configuration استفاده از Postgres و Redis را enforce می‌کند.
- migration و docker-compose برای Postgres/Redis اضافه شد.
- تست‌های hardening به زنجیره تست موجود اضافه شدند.
