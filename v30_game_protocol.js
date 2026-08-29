// v30 — WebSocket-safe view of authoritative Hokm state

function publicState(game, viewerSeat) {
  if (!game || !Number.isInteger(viewerSeat) || viewerSeat < 0 || viewerSeat > 3) {
    throw new Error("INVALID_VIEWER");
  }

  const s = game.snapshot();

  return {
    matchId:s.matchId,
    status:s.status,
    trump:s.trump,
    hokmPlayer:s.hokmPlayer,
    turn:s.turn,
    leader:s.leader,
    trick:s.trick,
    tricksWon:s.tricksWon,
    score:s.score,
    handNumber:s.handNumber,

    // Only the viewer gets their own cards.
    myHand:s.hands[viewerSeat],
    legalCards:s.turn === viewerSeat ? s.legalCards : []
  };
}

module.exports = {publicState};
