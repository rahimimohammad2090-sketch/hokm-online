# v28 Matchmaking

- بازی سریع با صف چهار نفره اضافه شد.
- تطبیق بر اساس mode و rating انجام می‌شود.
- محدوده rating با طولانی شدن انتظار افزایش می‌یابد.
- هر حساب فقط یک ticket فعال دارد.
- قطع WebSocket باعث خروج از صف می‌شود.
- Match ID توسط سرور ساخته می‌شود.
- کارت‌ها قبل از ورود به game room ارسال نمی‌شوند.
- مرحله بعد باید match reservation را به room/game server متصل کند.

برای مقیاس چند سروری، صف in-memory باید به Redis منتقل شود و عملیات join/match اتمیک شود؛ این الگو برای جلوگیری از double-match اهمیت دارد. citeturn0search6
