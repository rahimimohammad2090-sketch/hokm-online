# v31 — Realtime Game Protocol

## Connection
1. Open WSS connection.
2. Send `AUTH {token}`.
3. Send `ATTACH_GAME {room}` using the already-authorized v29/v30 room.
4. Receive `GAME_CONNECTED`.

## Gameplay
### Trump
Client:
`SET_TRUMP {suit}`

Server validates:
- authenticated user
- user belongs to room
- user is the Hokm player
- game is waiting for trump

### Card
Client:
`PLAY_CARD {suit,rank}`

Server validates:
- authenticated user
- player's seat
- correct turn
- card belongs to player's hand
- follow-suit rule

## Server events
- `GAME_CONNECTED`
- `PLAYER_CONNECTION`
- `GAME_STARTED`
- `STATE`
- `CARD_PLAYED`
- `TRICK_WON`
- `HAND_FINISHED`
- `ERROR`

## Reconnect
After reconnect:
1. authenticate again;
2. attach to the same authorized room;
3. request `STATE`;
4. client rebuilds UI from server state.

The client never reconstructs hidden hands, turn ownership, trick winner or score.
