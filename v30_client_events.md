# v30 Client Events

Client -> Server:
- SET_TRUMP {suit}
- PLAY_CARD {suit, rank}
- STATE_REQUEST

Server -> Client:
- GAME_STARTED
- STATE
- CARD_PLAYED
- TRICK_WON
- HAND_FINISHED
- ERROR

امنیت:
- client فقط درخواست حرکت می‌دهد.
- server کارت را از دست واقعی بازیکن پیدا می‌کند.
- server قانونی بودن حرکت و نوبت را تعیین می‌کند.
- hand سایر بازیکنان هیچ‌وقت به client ارسال نمی‌شود.
