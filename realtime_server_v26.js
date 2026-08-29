// Hokm Online v26 — server + persistent game results
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");
const {newGame, deal, play} = require("./v21_game_engine");
const {getSession} = require("./v24_session");
const db = require("./db_v26");

const PORT = process.env.PORT || 3000;
const rooms = new Map();

function code() {
  let c;
  do c = Math.random().toString(36).slice(2,8).toUpperCase();
  while (rooms.has(c));
  return c;
}
function send(s,type,payload={}) {
  if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify({type,...payload}));
}
function broadcast(room,type,payload={}) {
  room.players.forEach(p=>send(p.socket,type,payload));
}
function publicState(room) {
  const g=room.game;
  return {code:room.code,status:room.status,
    players:room.players.map(p=>({id:p.id,name:p.name,connected:p.connected,ready:p.ready})),
    game:g?{phase:g.phase,turn:g.turn,round:g.round,trump:g.trump,
      roundWins:g.roundWins,trick:g.trick}:null};
}
function sendStates(room) {
  room.players.forEach((p,i)=>send(p.socket,"GAME_STATE",{
    room:publicState(room),playerIndex:i,
    hand:room.game?room.game.hands[i]:[]
  }));
}
function startGame(room) {
  room.game=deal(newGame());
  room.gameId=crypto.randomUUID();
  room.startedAt=new Date().toISOString();
  room.status="PLAYING";
  sendStates(room);
}
function finalGameRecord(room) {
  const wins=room.game.roundWins || [0,0,0,0];
  const team0=wins[0]+wins[2], team1=wins[1]+wins[3];
  const winnerTeam=team0===team1 ? null : (team0>team1?0:1);
  return {
    id:room.gameId, roomCode:room.code, startedAt:room.startedAt,
    finishedAt:new Date().toISOString(), winnerTeam,
    result:{roundWins:wins, teamWins:[team0,team1]},
    players:room.players.map((p,i)=>({
      userId:p.id, team:i%2, seat:i,
      score:wins[i]||0,
      won:winnerTeam!==null && i%2===winnerTeam
    }))
  };
}

const server=http.createServer(async(req,res)=>{
  res.setHeader("Content-Type","application/json; charset=utf-8");
  if(req.url==="/health"){
    try {
      const dbTime=await db.healthCheck();
      return res.end(JSON.stringify({ok:true,version:"26v",database:true,dbTime}));
    } catch(e) {
      res.statusCode=503;
      return res.end(JSON.stringify({ok:false,version:"26v",database:false}));
    }
  }
  if(req.url==="/leaderboard"){
    try { return res.end(JSON.stringify({ok:true,items:await db.leaderboard(20)})); }
    catch(e){res.statusCode=500;return res.end(JSON.stringify({error:"DB_ERROR"}));}
  }
  res.statusCode=404; res.end(JSON.stringify({error:"NOT_FOUND"}));
});

const wss=new WebSocket.Server({server});

wss.on("connection",socket=>{
  let user=null,room=null;

  socket.on("message",async raw=>{
    try{
      const m=JSON.parse(raw.toString());

      if(m.type==="AUTH"){
        user=getSession(m.token);
        if(!user) throw new Error("INVALID_SESSION");
        return send(socket,"AUTHENTICATED",{user});
      }
      if(m.type==="PING") return send(socket,"PONG",{at:Date.now()});
      if(m.type==="GET_STATS"){
        if(!user) throw new Error("AUTH_REQUIRED");
        return send(socket,"STATS",{stats:await db.getStats(user.id)});
      }
      if(m.type==="GET_LEADERBOARD")
        return send(socket,"LEADERBOARD",{items:await db.leaderboard(m.limit)});

      if(!user) throw new Error("AUTH_REQUIRED");

      if(m.type==="CREATE_ROOM"){
        room={code:code(),status:"WAITING",
          players:[{id:user.id,name:user.displayName,connected:true,ready:false,socket}],
          game:null,gameId:null,startedAt:null};
        rooms.set(room.code,room);
        return send(socket,"ROOM_CREATED",{room:publicState(room)});
      }

      if(m.type==="JOIN_ROOM"){
        const target=rooms.get(String(m.code).toUpperCase());
        if(!target) throw new Error("ROOM_NOT_FOUND");
        if(target.status!=="WAITING") throw new Error("GAME_ALREADY_STARTED");
        if(target.players.length>=4) throw new Error("ROOM_FULL");
        if(target.players.some(p=>p.id===user.id)) throw new Error("PLAYER_ALREADY_IN_ROOM");
        room=target;
        room.players.push({id:user.id,name:user.displayName,connected:true,ready:false,socket});
        return broadcast(room,"ROOM_STATE",{room:publicState(room)});
      }

      if(!room) throw new Error("NOT_IN_ROOM");

      if(m.type==="READY"){
        const me=room.players.find(p=>p.id===user.id);
        if(!me) throw new Error("PLAYER_NOT_FOUND");
        me.ready=Boolean(m.value);
        if(room.players.length===4 && room.players.every(p=>p.ready)){
          startGame(room);
          broadcast(room,"GAME_STARTED",{room:publicState(room)});
          sendStates(room);
        } else broadcast(room,"ROOM_STATE",{room:publicState(room)});
        return;
      }

      if(m.type==="SET_TRUMP"){
        if(!room.game) throw new Error("GAME_NOT_STARTED");
        const idx=room.players.findIndex(p=>p.id===user.id);
        if(idx!==0) throw new Error("NOT_HAKEM");
        if(room.game.trump) throw new Error("TRUMP_ALREADY_SET");
        if(!["♠","♥","♦","♣"].includes(m.trump)) throw new Error("INVALID_TRUMP");
        room.game.trump=m.trump;
        return sendStates(room);
      }

      if(m.type==="PLAY_CARD"){
        if(!room.game || room.status!=="PLAYING") throw new Error("GAME_NOT_PLAYING");
        const idx=room.players.findIndex(p=>p.id===user.id);
        const result=play(room.game,idx,m.card);
        sendStates(room);
        broadcast(room,"TRICK_UPDATE",{playerId:user.id,card:m.card,result});

        if(result.gameFinished){
          room.status="FINISHED";
          const record=finalGameRecord(room);
          const saved=await db.recordGame(record);
          broadcast(room,"GAME_FINISHED",{room:publicState(room),saved});
        }
        return;
      }

      throw new Error("UNKNOWN_MESSAGE");
    }catch(e){send(socket,"ERROR",{message:e.message||"SERVER_ERROR"});}
  });

  socket.on("close",()=>{
    if(!room||!user)return;
    const p=room.players.find(x=>x.id===user.id);
    if(p){p.connected=false;p.socket=null;broadcast(room,"ROOM_STATE",{room:publicState(room)});}
  });
});

server.listen(PORT,()=>console.log("Hokm Online v26:",PORT));
