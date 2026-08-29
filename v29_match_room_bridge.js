const {Matchmaker}=require("./v28_matchmaker");const registry=require("./v29_room_registry");
const matchmaker=new Matchmaker({matchSize:4,baseRange:100,rangePerSecond:10,maxWait:120});
function createRoomsFromQueue(){const out=[];let m;while((m=matchmaker.findMatch())){const r=registry.createRoom(m);out.push({matchId:r.matchId,roomCode:r.roomCode,mode:r.mode,players:r.players.map(p=>({userId:p.userId,name:p.name,seat:p.seat,joinToken:p.joinToken}))})}return out}
module.exports={matchmaker,registry,createRoomsFromQueue};
