// Hokm Online v30 — authoritative Hokm engine
// Persian Hokm / Court Piece, 4 players, 2 teams.
// All card legality, turn order and scoring are server-authoritative.

const SUITS = ["S", "H", "D", "C"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RANK_VALUE = Object.fromEntries(RANKS.map((r,i)=>[r,i+2]));

function makeDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({suit, rank});
  }
  return deck;
}

function shuffle(deck, rng=Math.random) {
  const a = deck.slice();
  for (let i=a.length-1;i>0;i--) {
    const j=Math.floor(rng()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function cardId(c) { return `${c.rank}${c.suit}`; }

function validSuit(suit) {
  if (!SUITS.includes(suit)) throw new Error("INVALID_SUIT");
}

function nextPlayer(p) { return (p + 1) % 4; }

class HokmGame {
  constructor({matchId, players, rng=Math.random}) {
    if (!matchId) throw new Error("MATCH_ID_REQUIRED");
    if (!Array.isArray(players) || players.length !== 4) {
      throw new Error("FOUR_PLAYERS_REQUIRED");
    }

    const seats = players.map(p=>p.seat).sort((a,b)=>a-b);
    if (seats.join(",") !== "0,1,2,3") throw new Error("INVALID_SEATS");

    this.matchId = matchId;
    this.players = players.slice().sort((a,b)=>a.seat-b.seat)
      .map(p=>({userId:p.userId, seat:p.seat, name:p.name || ""}));
    this.teamOf = [0,1,0,1]; // seats 0+2 vs 1+3
    this.rng = rng;

    this.status = "NEW";
    this.trump = null;
    this.hokmPlayer = null;
    this.hokmTeam = null;
    this.hands = [[],[],[],[]];
    this.trick = [];
    this.tricksWon = [0,0];
    this.score = [0,0];
    this.handNumber = 0;
    this.turn = null;
    this.leader = null;
    this.history = [];
  }

  start() {
    if (this.status !== "NEW") throw new Error("GAME_ALREADY_STARTED");
    this.status = "WAITING_FOR_HOKM";
    this.hokmPlayer = this.rngPlayer();
    this.hokmTeam = this.teamOf[this.hokmPlayer];
    this.leader = this.hokmPlayer;
    this.turn = this.hokmPlayer;
    return this.snapshot();
  }

  rngPlayer() {
    return Math.floor(this.rng()*4);
  }

  setTrump(playerSeat, suit) {
    validSuit(suit);
    if (this.status !== "WAITING_FOR_HOKM") throw new Error("TRUMP_NOT_ALLOWED_NOW");
    if (playerSeat !== this.hokmPlayer) throw new Error("ONLY_HOKM_PLAYER_CAN_SET_TRUMP");

    this.trump = suit;
    this.deal();
    this.status = "PLAYING";
    this.turn = this.leader;
    return this.snapshot();
  }

  deal() {
    const deck = shuffle(makeDeck(), this.rng);
    this.hands = [[],[],[],[]];

    // Standard server deal: 13 cards each. Trump is already known before play.
    for (let i=0;i<52;i++) this.hands[i%4].push(deck[i]);

    for (const hand of this.hands) {
      hand.sort((a,b)=>
        SUITS.indexOf(a.suit)-SUITS.indexOf(b.suit) ||
        RANK_VALUE[a.rank]-RANK_VALUE[b.rank]
      );
    }
    this.handNumber += 1;
    this.tricksWon = [0,0];
    this.trick = [];
    this.history = [];
  }

  handFor(seat) {
    return this.hands[seat].map(c=>({...c}));
  }

  legalCards(seat) {
    if (this.status !== "PLAYING") return [];
    if (seat !== this.turn) return [];

    const hand = this.hands[seat];
    if (this.trick.length === 0) return this.handFor(seat);

    const leadSuit = this.trick[0].card.suit;
    const follow = hand.filter(c=>c.suit === leadSuit);
    return this.handFor(seat).filter(c=>
      follow.length === 0 || c.suit === leadSuit
    );
  }

  playCard(seat, card) {
    if (this.status !== "PLAYING") throw new Error("GAME_NOT_PLAYING");
    if (seat !== this.turn) throw new Error("NOT_YOUR_TURN");
    if (!card || !SUITS.includes(card.suit) || !RANKS.includes(card.rank)) {
      throw new Error("INVALID_CARD");
    }

    const hand = this.hands[seat];
    const index = hand.findIndex(c=>c.suit===card.suit && c.rank===card.rank);
    if (index < 0) throw new Error("CARD_NOT_IN_HAND");

    const legal = this.legalCards(seat);
    if (!legal.some(c=>c.suit===card.suit && c.rank===card.rank)) {
      throw new Error("MUST_FOLLOW_SUIT");
    }

    const played = hand.splice(index,1)[0];
    this.trick.push({seat, card:played});
    this.history.push({type:"PLAY",seat,card:{...played}});

    if (this.trick.length < 4) {
      this.turn = nextPlayer(this.turn);
      return this.snapshot();
    }

    const winner = this.trickWinner();
    const winningTeam = this.teamOf[winner];
    this.tricksWon[winningTeam] += 1;

    this.history.push({type:"TRICK_WON",seat:winner,team:winningTeam});
    this.leader = winner;
    this.turn = winner;
    this.trick = [];

    if (this.tricksWon[0] >= 7 || this.tricksWon[1] >= 7) {
      const gameWinner = this.tricksWon[0] >= 7 ? 0 : 1;
      this.score[gameWinner] += 1;
      this.status = "HAND_FINISHED";
      this.history.push({
        type:"HAND_FINISHED",
        winner:gameWinner,
        tricks:[...this.tricksWon],
        score:[...this.score]
      });
    }

    return this.snapshot();
  }

  trickWinner() {
    if (this.trick.length !== 4) throw new Error("TRICK_NOT_COMPLETE");
    const leadSuit = this.trick[0].card.suit;

    let best = this.trick[0];

    for (const play of this.trick.slice(1)) {
      if (this.beats(play.card,best.card,leadSuit)) best = play;
    }
    return best.seat;
  }

  beats(a,b,leadSuit) {
    const aTrump = a.suit === this.trump;
    const bTrump = b.suit === this.trump;
    if (aTrump !== bTrump) return aTrump;
    if (a.suit !== b.suit) {
      if (a.suit === leadSuit && b.suit !== leadSuit) return true;
      return false;
    }
    return RANK_VALUE[a.rank] > RANK_VALUE[b.rank];
  }

  snapshot() {
    return {
      matchId:this.matchId,
      status:this.status,
      trump:this.trump,
      hokmPlayer:this.hokmPlayer,
      turn:this.turn,
      leader:this.leader,
      trick:this.trick.map(x=>({seat:x.seat,card:{...x.card}})),
      tricksWon:[...this.tricksWon],
      score:[...this.score],
      handNumber:this.handNumber,
      hands:this.hands.map(h=>h.map(c=>({...c}))),
      legalCards:this.turn === null ? [] : this.legalCards(this.turn)
    };
  }
}

module.exports = {HokmGame,makeDeck,shuffle};
