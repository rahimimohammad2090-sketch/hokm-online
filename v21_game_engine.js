// Hokm Online v21
// اتصال موتور قوانین بازی به سرور realtime

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function deck() {
  return SUITS.flatMap(s => RANKS.map(r => ({suit:s, rank:r})));
}

function shuffle(a) {
  a = [...a];
  for (let i=a.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function newGame() {
  return {
    phase: "PLAYING",
    turn: 0,
    round: 1,
    trump: null,
    hands: [[],[],[],[]],
    trick: [],
    roundWins: [0,0,0,0]
  };
}

function deal(game) {
  const cards = shuffle(deck());
  game.hands = [[],[],[],[]];
  cards.forEach((c,i) => game.hands[i%4].push(c));
  game.trick = [];
  game.round = 1;
  game.turn = 0;
  game.roundWins = [0,0,0,0];
  return game;
}

function cardId(c) {
  return `${c.suit}:${c.rank}`;
}

function hasCard(hand, card) {
  return hand.some(c => cardId(c) === cardId(card));
}

function legal(game, player, card) {
  if (game.turn !== player) return {ok:false, reason:"NOT_YOUR_TURN"};
  if (!hasCard(game.hands[player], card)) return {ok:false, reason:"CARD_NOT_IN_HAND"};

  if (!game.trick.length) return {ok:true};

  const lead = game.trick[0].card.suit;
  const hasLead = game.hands[player].some(c => c.suit === lead);
  if (hasLead && card.suit !== lead) return {ok:false, reason:"MUST_FOLLOW_SUIT"};

  return {ok:true};
}

function value(rank) {
  return RANKS.indexOf(rank);
}

function trickWinner(trick, trump) {
  const lead = trick[0].card.suit;
  let best = trick[0];

  for (const p of trick.slice(1)) {
    const a = p.card, b = best.card;
    const at = a.suit === trump, bt = b.suit === trump;
    const al = a.suit === lead, bl = b.suit === lead;

    if ((at && !bt) ||
        (at === bt && al && !bl) ||
        (at === bt && al === bl && value(a.rank) > value(b.rank))) {
      best = p;
    }
  }
  return best.player;
}

function play(game, player, card) {
  const check = legal(game, player, card);
  if (!check.ok) throw new Error(check.reason);

  const hand = game.hands[player];
  const index = hand.findIndex(c => cardId(c) === cardId(card));
  hand.splice(index, 1);
  game.trick.push({player, card});

  if (game.trick.length < 4) {
    game.turn = (player + 1) % 4;
    return {trickFinished:false, winner:null};
  }

  const winner = trickWinner(game.trick, game.trump);
  game.roundWins[winner]++;
  game.trick = [];

  if (game.round >= 13) {
    game.phase = "FINISHED";
    return {trickFinished:true, winner, gameFinished:true};
  }

  game.round++;
  game.turn = winner;
  return {trickFinished:true, winner, gameFinished:false};
}

module.exports = {
  newGame, deal, legal, play
};
