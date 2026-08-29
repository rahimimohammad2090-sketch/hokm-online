const PERMISSIONS={player:new Set(["match:join","match:play","match:leave"]),spectator:new Set(["match:view"]),admin:new Set(["match:join","match:play","match:leave","match:view","match:moderate"])};
function can(r,p){return !!PERMISSIONS[r]&&PERMISSIONS[r].has(p)}
function assertSeatOwner(s,u){if(!s||s.userId!==u)throw Error("SEAT_FORBIDDEN");return true}
module.exports={can,assertSeatOwner,PERMISSIONS};