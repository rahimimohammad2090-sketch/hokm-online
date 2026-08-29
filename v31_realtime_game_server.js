// Hokm Online v31 — realtime authoritative game server
const http = require("http");
const WebSocket = require("ws");
const { getSession } = require("./v24_session");
const { createGameFromRoom } = require("./v30_room_game_adapter");
const { publicState } = require("./v30_game_protocol");

// roomId -> { game, sockets: Map<userId, socket>, seatByUser: Map<userId, seat>, lastActivity }
const liveGames = new Map();

function send(ws, type, payload = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function broadcast(room, type, payloadFactory) {
  for (const [userId, ws] of room.sockets) {
    const seat = room.seatByUser.get(userId);
    const payload = typeof payloadFactory === "function"
      ? payloadFactory(seat, userId)
      : payloadFactory;
    send(ws, type, payload);
  }
}

function roomForUser(userId) {
  for (const room of liveGames.values()) {
    if (room.seatByUser.has(userId)) return room;
  }
  return null;
}

function attachRoom(room) {
  if (!room || !room.matchId) throw new Error("INVALID_GAME_ROOM");
  if (liveGames.has(room.matchId)) return liveGames.get(room.matchId);

  const game = createGameFromRoom(room);
  const live = {
    matchId: room.matchId,
    game,
    sockets: new Map(),
    seatByUser: new Map(),
    lastActivity: Date.now()
  };

  for (const p of room.players) {
    live.seatByUser.set(p.userId, p.seat);
  }

  liveGames.set(room.matchId, live);
  return live;
}

function connectPlayer(room, userId, socket) {
  const seat = room.seatByUser.get(userId);
  if (seat === undefined) throw new Error("PLAYER_NOT_IN_GAME");

  room.sockets.set(userId, socket);
  room.lastActivity = Date.now();

  send(socket, "GAME_CONNECTED", {
    matchId: room.matchId,
    seat,
    state: publicState(room.game, seat)
  });

  broadcast(room, "PLAYER_CONNECTION", {
    userId,
    connected: true
  });
}

function disconnectPlayer(room, userId) {
  room.sockets.delete(userId);
  room.lastActivity = Date.now();
  broadcast(room, "PLAYER_CONNECTION", {
    userId,
    connected: false
  });
}

function requireSeat(room, userId) {
  const seat = room.seatByUser.get(userId);
  if (seat === undefined) throw new Error("PLAYER_NOT_IN_GAME");
  return seat;
}

function handleGameMessage(room, user, message) {
  room.lastActivity = Date.now();
  const seat = requireSeat(room, user.id);

  if (message.type === "STATE_REQUEST") {
    return {
      type: "STATE",
      payload: publicState(room.game, seat)
    };
  }

  if (message.type === "SET_TRUMP") {
    room.game.setTrump(seat, message.suit);

    broadcast(room, "GAME_STARTED", (viewerSeat) =>
      publicState(room.game, viewerSeat)
    );
    return null;
  }

  if (message.type === "PLAY_CARD") {
    const stateBefore = room.game.snapshot();
    const card = {
      suit: message.suit,
      rank: message.rank
    };

    room.game.playCard(seat, card);

    const stateAfter = room.game.snapshot();

    broadcast(room, "STATE", (viewerSeat) =>
      publicState(room.game, viewerSeat)
    );

    // Explicit event for animation/UI.
    broadcast(room, "CARD_PLAYED", {
      seat,
      card,
      turn: stateAfter.turn
    });

    if (stateBefore.trick.length === 3 && stateAfter.trick.length === 0) {
      const last = room.game.history[room.game.history.length - 1];
      if (last && last.type === "TRICK_WON") {
        broadcast(room, "TRICK_WON", last);
      }
    }

    if (stateAfter.status === "HAND_FINISHED") {
      const finish = room.game.history[room.game.history.length - 1];
      broadcast(room, "HAND_FINISHED", finish);
    }

    return null;
  }

  throw new Error("UNKNOWN_GAME_MESSAGE");
}

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.url === "/health") {
    return res.end(JSON.stringify({
      ok: true,
      version: "31v",
      service: "realtime-hokm-game"
    }));
  }

  if (req.url === "/games") {
    return res.end(JSON.stringify({
      liveGames: liveGames.size
    }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "NOT_FOUND" }));
});

const wss = new WebSocket.Server({ server });

wss.on("connection", socket => {
  let user = null;
  let activeRoom = null;

  socket.on("message", raw => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === "AUTH") {
        user = getSession(message.token);
        if (!user) throw new Error("INVALID_SESSION");
        return send(socket, "AUTHENTICATED", { user });
      }

      if (!user) throw new Error("AUTH_REQUIRED");

      // A production gateway should pass the authoritative v29 room.
      // This message only identifies the already-authorized room.
      if (message.type === "ATTACH_GAME") {
        const room = message.room;
        if (!room || room.status !== "STARTED") {
          throw new Error("ROOM_NOT_STARTED");
        }

        activeRoom = attachRoom(room);
        connectPlayer(activeRoom, user.id, socket);
        return;
      }

      if (!activeRoom) {
        // Reuse an already attached room if this user reconnects.
        activeRoom = roomForUser(user.id);
        if (activeRoom) connectPlayer(activeRoom, user.id, socket);
      }

      if (!activeRoom) throw new Error("GAME_NOT_ATTACHED");

      const result = handleGameMessage(activeRoom, user, message);
      if (result) send(socket, result.type, result.payload);
    } catch (error) {
      send(socket, "ERROR", {
        message: error.message || "GAME_SERVER_ERROR"
      });
    }
  });

  socket.on("close", () => {
    if (user && activeRoom) {
      disconnectPlayer(activeRoom, user.id);
    }
  });
});

const port = process.env.GAME_PORT || 3004;
server.listen(port, () =>
  console.log(`Hokm Online v31 realtime server on ${port}`)
);

module.exports = { liveGames, attachRoom };
