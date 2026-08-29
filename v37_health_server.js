const http = require('http');
const { checkReadiness } = require('./v37_readiness');

function createHealthServer({ env = process.env, persistence = null, tls = null, requiredPersistence = true, version = 'production' } = {}) {
  return http.createServer((req,res) => {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    if (req.url === '/health') {
      res.writeHead(200); res.end(JSON.stringify({ ok:true, status:'alive', version, ts:Date.now() })); return;
    }
    if (req.url === '/ready') {
      const result = checkReadiness({env,persistence,tls,requiredPersistence});
      res.writeHead(result.ok ? 200 : 503); res.end(JSON.stringify({...result,version})); return;
    }
    res.writeHead(404); res.end(JSON.stringify({ok:false,error:'NOT_FOUND'}));
  });
}
module.exports = { createHealthServer };
