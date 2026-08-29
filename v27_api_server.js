// Hokm Online v27 — profile/ranking HTTP API
const http = require("http");
const db = require("./db_v27");
const {getSession}=require("./v24_session");

function json(res,status,payload){
  res.statusCode=status;
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function auth(req){
  const token=req.headers.authorization||"";
  if(!token.startsWith("Bearer ")) return null;
  return getSession(token.slice(7));
}

const server=http.createServer(async(req,res)=>{
  try{
    if(req.url==="/health"){
      await db.pool.query("SELECT 1");
      return json(res,200,{ok:true,version:"27v"});
    }

    const user=auth(req);
    if(!user) return json(res,401,{error:"AUTH_REQUIRED"});

    if(req.url==="/api/profile")
      return json(res,200,{profile:await db.getProfile(user.id)});

    if(req.url==="/api/achievements")
      return json(res,200,{items:await db.getAchievements(user.id)});

    if(req.url==="/api/history")
      return json(res,200,{items:await db.recentGames(user.id,20)});

    if(req.url==="/api/leaderboard")
      return json(res,200,{items:await db.leaderboard(50)});

    return json(res,404,{error:"NOT_FOUND"});
  }catch(e){
    return json(res,500,{error:"SERVER_ERROR"});
  }
});

server.listen(process.env.API_PORT||3001,()=>{
  console.log("Hokm Online v27 API ready");
});
