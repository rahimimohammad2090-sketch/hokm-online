# v31 Reconnect / Timeout Policy

Reference policy:
- Disconnect does NOT change the authoritative game state.
- Player may reconnect to the same room.
- On reconnect, the server sends only that player's private hand plus public state.
- No card is automatically played on behalf of a disconnected player in v31.
- A future production step should add server-side turn timers.
- Recommended next step: 30–60 second turn timeout with a clearly documented fallback rule.
- Never let the client advance the turn.
