const assert = require("assert");
const { HokmGame } = require("./v30_hokm_engine");

const players = [0,1,2,3].map(seat => ({
  userId:`u${seat}`, seat, name:`P${seat}`
}));

const game = new HokmGame({
  matchId:"v31-test",
  players,
  rng:()=>0.25
});

game.start();
assert.strictEqual(game.status, "WAITING_FOR_HOKM");

const hokm = game.hokmPlayer;
assert.strictEqual(hokm, 1);

game.setTrump(hokm, "S");
assert.strictEqual(game.status, "PLAYING");
assert.strictEqual(game.hands.every(h => h.length === 13), true);

// Turn enforcement.
assert.throws(
  () => game.playCard((game.turn + 1) % 4, game.hands[(game.turn + 1) % 4][0]),
  /NOT_YOUR_TURN/
);

// Legal-card enforcement.
const legal = game.legalCards(game.turn);
assert(legal.length > 0);

// Card must be in the hand and legal.
game.playCard(game.turn, legal[0]);
assert.strictEqual(game.trick.length, 1);

console.log("v31 realtime/game integration tests: PASS");
