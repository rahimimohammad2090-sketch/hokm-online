// Hokm Online v15
// هسته اتاق آنلاین چهار نفره و همگام‌سازی وضعیت

const MAX_PLAYERS = 4;

function createRoom(host) {
  return {
    id: makeRoomCode(),
    hostId: host.id,
    status: "WAITING",
    players: [normalizePlayer(host)],
    ready: {},
    spectators: [],
    createdAt: Date.now()
  };
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizePlayer(player) {
  return {
    id: String(player.id),
    name: player.name || "بازیکن",
    connected: true
  };
}

function joinRoom(room, player) {
  if (room.status !== "WAITING") throw new Error("اتاق در حال بازی است");
  if (room.players.length >= MAX_PLAYERS) throw new Error("ظرفیت اتاق تکمیل است");
  if (room.players.some(p => p.id === String(player.id))) {
    throw new Error("بازیکن قبلاً وارد اتاق شده است");
  }
  room.players.push(normalizePlayer(player));
  return room;
}

function setReady(room, playerId, value) {
  if (!room.players.some(p => p.id === String(playerId))) {
    throw new Error("بازیکن در اتاق نیست");
  }
  room.ready[String(playerId)] = Boolean(value);
  return room;
}

function allReady(room) {
  return room.players.length === MAX_PLAYERS &&
    room.players.every(p => room.ready[p.id] === true);
}

function startRoom(room) {
  if (!allReady(room)) throw new Error("همه چهار بازیکن باید آماده باشند");
  room.status = "PLAYING";
  return room;
}

function leaveRoom(room, playerId) {
  room.players = room.players.filter(p => p.id !== String(playerId));
  delete room.ready[String(playerId)];

  if (String(playerId) === String(room.hostId) && room.players.length) {
    room.hostId = room.players[0].id;
  }

  if (!room.players.length) room.status = "CLOSED";
  return room;
}

function snapshot(room) {
  return JSON.parse(JSON.stringify(room));
}

module.exports = {
  MAX_PLAYERS,
  createRoom,
  joinRoom,
  setReady,
  allReady,
  startRoom,
  leaveRoom,
  snapshot
};
