const crypto=require("crypto");
function sanitizeString(v,max=256){if(typeof v!=="string")return "";return v.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g,"").trim().slice(0,max)}
function validateAction(a){return !!a&&typeof a==="object"&&typeof a.actionId==="string"&&/^[A-Za-z0-9_-]{8,128}$/.test(a.actionId)&&Number.isInteger(a.seq)&&a.seq>0&&typeof a.type==="string"&&/^[A-Z][A-Z0-9_]{1,48}$/.test(a.type)}
function constantTimeEqual(a,b){const A=Buffer.from(String(a)),B=Buffer.from(String(b));return A.length===B.length&&crypto.timingSafeEqual(A,B)}
module.exports={sanitizeString,validateAction,constantTimeEqual};