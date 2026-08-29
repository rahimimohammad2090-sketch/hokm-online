// UI helpers for v26
// بعد از احراز هویت:
// client.send("GET_STATS")
// client.send("GET_LEADERBOARD",{limit:20})

function renderStats(stats, root) {
  root.innerHTML =
    `بازی‌ها: ${stats.games_played}<br>` +
    `بردها: ${stats.games_won}<br>` +
    `نرخ برد: ${stats.win_rate}%<br>` +
    `امتیاز: ${stats.total_score}`;
}

function renderLeaderboard(items, root) {
  root.innerHTML = items.map((p,i)=>
    `<div>${i+1}. ${escapeHtml(p.display_name)} — ` +
    `${p.games_won} برد | ${p.win_rate}% | ${p.total_score} امتیاز</div>`
  ).join("");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#039;"
  }[c]));
}
