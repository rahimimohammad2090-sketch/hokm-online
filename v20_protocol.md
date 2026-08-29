# Hokm Online v20 — Realtime Protocol

## Client → Server
- `CREATE_ROOM`
- `JOIN_ROOM`
- `READY`
- `PLAY_CARD`
- `PING`

## Server → Client
- `ROOM_CREATED`
- `ROOM_STATE`
- `MOVE_RECEIVED`
- `PONG`
- `ERROR`

## جریان
اتصال WebSocket → ورود/ساخت اتاق → همگام‌سازی وضعیت اتاق → آماده‌شدن بازیکنان → ارسال حرکت → دریافت رویداد از سرور.

> در این نسخه، `PLAY_CARD` فقط اسکلت انتقال پیام است؛ اعتبارسنجی کامل حرکت و اعمال آن باید مستقیماً به موتور بازی v18 متصل شود.
