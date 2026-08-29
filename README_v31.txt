Hokm Online v31

هدف:
تبدیل موتور v30 از یک هسته بازی به یک بازی لحظه‌ای چندنفره.

Flow:
v29 Room STARTED
 -> v31 WebSocket AUTH
 -> ATTACH_GAME
 -> GAME_CONNECTED
 -> SET_TRUMP
 -> CARD_PLAYED
 -> STATE / TRICK_WON
 -> HAND_FINISHED

امنیت:
تمام تصمیم‌های بازی روی سرور است.
کلاینت فقط درخواست حرکت می‌دهد.
کارت‌های سایر بازیکنان هرگز در public state ارسال نمی‌شوند.

Reconnect:
قطع اتصال state را تغییر نمی‌دهد؛ بازیکن پس از احراز هویت دوباره به همان room متصل و state را دریافت می‌کند.

گام پیشنهادی v32:
UI کامل میز حکم + کارت‌های واقعی + انیمیشن + تایمر نوبت + نمایش امتیاز و وضعیت حاکم.
