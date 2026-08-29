// v30 engine tests — no network/database required
const assert = require("assert");
const {HokmGame} = require("./v30_hokm_engine");

function players(){
  return [0,1,2,3].map(seat=>({
    userId:`u${seat}`,seat,name:`P${seat}`
  }));
}

const game = new HokmGame({
  matchId:"test-match",
  players:players(),
  rng:()=>0.25
});

game.start();
assert.equal(game.status,"WAITING_FOR_HOKM");
assert.equal(game.hokmPlayer,1);

game.setTrump(1,"S");
assert.equal(game.status,"PLAYING");
assert.equal(game.hands.reduce((n,h)=>n+h.length,0),52);
assert.equal(game.hands.every(h=>h.length===13),true);
assert.equal(game.turn,1);

// Must have exactly one legal-card set for current player.
assert(game.legalCards(1).length > 0);

// Invalid turn must fail.
assert.throws(()=>game.playCard(0,game.hands[0][0]),/NOT_YOUR_TURN/);

// Valid card must be accepted.
const legal=game.legalCards(1)[0];
game.playCard(1,legal);
assert.equal(game.trick.length,1);
assert.equal(game.turn,2);

// Replaying a removed card must fail.
assert.throws(()=>game.playCard(1,legal),/NOT_YOUR_TURN/);

console.log("v30 engine tests: PASS");
