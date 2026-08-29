Hokm Online v30

Flow:
v29 Room STARTED
  -> createGameFromRoom()
  -> HokmGame.start()
  -> Hokm player selects trump
  -> 52 cards shuffled/dealt
  -> players play legal cards
  -> server resolves tricks
  -> first team to 7 tricks wins the hand

این نسخه intentionally سرورمحور است؛ کلاینت نباید قوانین بازی یا کارت‌های بازیکنان دیگر را تعیین کند.

گام بعدی پیشنهادی v31:
اتصال کامل WebSocket بازی به همین موتور + مدیریت reconnect/timeout + persistence رویدادها.
