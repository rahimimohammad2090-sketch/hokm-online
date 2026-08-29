const fs = require("fs");
function loadSecret({env=process.env,key="AUTH_SECRET",fileEnv="AUTH_SECRET_FILE"}={}){
  if(env[key] && String(env[key]).trim()) return String(env[key]).trim();
  const file=env[fileEnv];
  if(file){ const value=fs.readFileSync(file,"utf8").trim(); if(value) return value; }
  throw new Error(`${key}_REQUIRED`);
}
module.exports={loadSecret};
