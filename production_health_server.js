const http=require('http');
const fs=require('fs');
const path=require('path');
const {checkReadiness}=require('./production_readiness');
function createHealthServer(opts={}){
 return http.createServer(async(req,res)=>{
  if(req.url==='/' || req.url==='/index.html'){ res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(fs.readFileSync(path.join(__dirname,'index.html'))); return; }
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.url==='/health'){res.writeHead(200);res.end(JSON.stringify({ok:true,status:'alive',version:opts.version||'production',ts:Date.now()}));return}
  if(req.url==='/ready'){
   try{const r=await checkReadiness(opts);res.writeHead(r.ok?200:503);res.end(JSON.stringify({...r,version:opts.version||'production'}));}
   catch(e){res.writeHead(503);res.end(JSON.stringify({ok:false,status:'not_ready',error:'READINESS_CHECK_FAILED'}));}
   return;
  }
  res.writeHead(404);res.end(JSON.stringify({ok:false,error:'NOT_FOUND'}));
 });
}
module.exports={createHealthServer};
