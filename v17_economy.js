// Hokm Online v17
// اقتصاد بازی: سکه، پاداش روزانه، فروشگاه و جوایز

const DAILY_REWARD = 500;
const MAX_DAILY_STREAK = 7;

const SHOP = [
  { id: "COINS_1", title: "بسته کوچک", coins: 1000, price: 1 },
  { id: "COINS_2", title: "بسته متوسط", coins: 5000, price: 5 },
  { id: "COINS_3", title: "بسته بزرگ", coins: 12000, price: 10 }
];

function wallet(profile) {
  if (!Number.isFinite(profile.coins) || profile.coins < 0) profile.coins = 0;
  return profile;
}

function addCoins(profile, amount, reason = "reward") {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("مقدار سکه نامعتبر است");
  }
  profile.coins += amount;
  return { coins: profile.coins, amount, reason };
}

function spendCoins(profile, amount, reason = "entry") {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("مقدار هزینه نامعتبر است");
  }
  if (profile.coins < amount) throw new Error("سکه کافی نیست");
  profile.coins -= amount;
  return { coins: profile.coins, amount, reason };
}

function claimDaily(profile, now = Date.now()) {
  const day = 86400000;
  const last = Number(profile.lastDaily || 0);

  if (last && now - last < day) {
    return { claimed: false, coins: profile.coins, nextInMs: day - (now - last) };
  }

  let streak = Number(profile.dailyStreak || 0);
  streak = (streak % MAX_DAILY_STREAK) + 1;

  const reward = DAILY_REWARD * streak;
  profile.coins += reward;
  profile.dailyStreak = streak;
  profile.lastDaily = now;

  return { claimed: true, reward, streak, coins: profile.coins };
}

function purchase(profile, productId) {
  const item = SHOP.find(x => x.id === productId);
  if (!item) throw new Error("محصول پیدا نشد");

  // price در این نسخه واحد داخلی است و به درگاه پرداخت واقعی متصل نیست.
  return {
    productId: item.id,
    title: item.title,
    coins: item.coins,
    price: item.price,
    status: "PENDING_PAYMENT"
  };
}

function matchReward(profile, won) {
  return addCoins(profile, won ? 250 : 50, won ? "match_win" : "match_participation");
}

module.exports = {
  DAILY_REWARD,
  MAX_DAILY_STREAK,
  SHOP,
  wallet,
  addCoins,
  spendCoins,
  claimDaily,
  purchase,
  matchReward
};
