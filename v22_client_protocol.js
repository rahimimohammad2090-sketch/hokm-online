// Hokm Online v22
// لایه کلاینت برای اتصال رابط موبایل به WebSocket v21

class HokmClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.state = null;
    this.handlers = {};
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => this.emit("connected");
    this.ws.onclose = () => this.emit("disconnected");
    this.ws.onerror = e => this.emit("error", e);
    this.ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      this.state = msg.room || this.state;
      this.emit(msg.type, msg);
    };
  }

  on(type, fn) {
    (this.handlers[type] ||= []).push(fn);
  }

  emit(type, payload) {
    (this.handlers[type] || []).forEach(fn => fn(payload));
  }

  send(type, payload={}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("اتصال برقرار نیست");
    }
    this.ws.send(JSON.stringify({type, ...payload}));
  }

  createRoom(playerId, name) {
    this.send("CREATE_ROOM", {playerId, name});
  }

  joinRoom(code, playerId, name) {
    this.send("JOIN_ROOM", {code, playerId, name});
  }

  ready(value) {
    this.send("READY", {value});
  }

  setTrump(trump) {
    this.send("SET_TRUMP", {trump});
  }

  playCard(card) {
    this.send("PLAY_CARD", {card});
  }

  ping() {
    this.send("PING");
  }
}
