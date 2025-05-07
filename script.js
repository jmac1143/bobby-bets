// === CONFIG ===
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://icy-thunder-2eb4.jfmccartney.workers.dev/";
const MAX_WAGER = 500;

const WEEK_GID_MAP = { 1: "0", 2: "202324890", 3: "441155668", 4: "1793741269" };
const DEV_OVERRIDE_WEEK = null;

function getCurrentNFLWeek() {
  if (DEV_OVERRIDE_WEEK !== null) return DEV_OVERRIDE_WEEK;
  const startDates = [
    "2025-09-02T12:00:00", "2025-09-09T12:00:00", "2025-09-16T12:00:00",
    "2025-09-23T12:00:00", "2025-09-30T12:00:00"
  ];
  const now = new Date();
  for (let i = startDates.length - 1; i >= 0; i--) {
    if (now >= new Date(startDates[i])) return i + 1;
  }
  return 1;
}

let currentUser = localStorage.getItem("bobbybets_user");
const weekNum = getCurrentNFLWeek();
const gid = WEEK_GID_MAP[weekNum];
const MATCHUP_CSV = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=${gid}&single=true&output=csv`;

let betSlip = [];
let wagerAmount = 50;

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("bet.html")) initBetPage();
  loadWeeklyLeaderboard();
  loadSeasonLeaderboard();
  setupLeaderboardToggle();
});

// === BET PAGE LOGIC ===
function initBetPage() {
  if (!currentUser) {
    alert("You must log in through the homepage.");
    window.location.href = "index.html";
    return;
  }

  const nameEl = document.getElementById("user-name");
  if (nameEl) nameEl.textContent = currentUser;

  // Load bankroll
  Papa.parse(BANKROLL_CSV, {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const userRow = data.find(row => row.Bettor?.trim().toLowerCase() === currentUser?.toLowerCase());
      const bankroll = userRow ? parseFloat(userRow.Bankroll.replace(/[$,]/g, '')) || 0 : 0;
      const el = document.getElementById("bankroll");
      if (el) el.textContent = bankroll.toFixed(2);
    }
  });

  // Load matchups
  Papa.parse(MATCHUP_CSV, {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const matchupsDiv = document.getElementById("matchups");
      if (!matchupsDiv) return;

      data.forEach((row, i) => {
        if (!row["Team A"] || !row["Team B"]) return;

        const teamA = row["Team A"].trim();
        const teamB = row["Team B"].trim();
        const spread = row["Spread"];
        const mlA = Number(row["Moneyline A"]);
        const mlB = Number(row["Moneyline B"]);
        const spreadOddsA = Number(row["Spread Odds A"]);
        const spreadOddsB = Number(row["Spread Odds B"]);
        const overOdds = Number(row["Over Odds"]) || -110;
        const underOdds = Number(row["Under Odds"]) || -110;
        const totalPoints = row["Over/Under Line"] || "";

        const createButton = (label, odds, type) => {
          const btn = document.createElement("button");
          btn.textContent = `${label} (${odds > 0 ? "+" + odds : odds})`;
          btn.addEventListener("click", () => addToSlip({ label, odds, type }));
          return btn;
        };

        const container = document.createElement("div");
        container.innerHTML = `<h3>Game ${i + 1}: ${teamA} vs ${teamB}</h3>`;
        container.appendChild(createButton(`${teamA} ${spread}`, spreadOddsA, "spread"));
        container.appendChild(createButton(`${teamB} ${spread}`, spreadOddsB, "spread"));
        container.appendChild(createButton(`${teamA} ML`, mlA, "ml"));
        container.appendChild(createButton(`${teamB} ML`, mlB, "ml"));
        container.appendChild(createButton(`OVER ${totalPoints}`, overOdds, "over"));
        container.appendChild(createButton(`UNDER ${totalPoints}`, underOdds, "under"));

        matchupsDiv.appendChild(container);
      });
    }
  });

  const wagerInput = document.getElementById("wager-input");
  if (wagerInput) {
    wagerInput.addEventListener("change", (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0 && val <= MAX_WAGER) {
        wagerAmount = val;
        renderSlip();
      } else {
        alert(`Enter a valid wager amount (1 - ${MAX_WAGER})`);
        e.target.value = wagerAmount;
      }
    });
  }

  const resetBtn = document.getElementById("reset-slip");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      betSlip = [];
      renderSlip();
    });
  }

  const submitBtn = document.getElementById("submit-bet");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      if (!currentUser || betSlip.length === 0) {
        alert("Invalid bet or missing user.");
        return;
      }

      const wagerInputVal = parseFloat(document.getElementById("wager-input").value);
      if (isNaN(wagerInputVal) || wagerInputVal <= 0 || wagerInputVal > MAX_WAGER) {
        alert(`Please enter a valid wager up to $${MAX_WAGER}`);
        return;
      }

      wagerAmount = wagerInputVal;

      const timestamp = new Date().toLocaleString();
      const week = getCurrentNFLWeek();

      const payload = {
        bettor: currentUser,
        bets: betSlip.map(b => ({ type: b.type, selection: b.label, odds: Number(b.odds) })),
        wager: wagerAmount,
        timestamp,
        week
      };

      fetch(SCRIPT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => res.text())
        .then(response => {
          alert("Bet submitted!");
          betSlip = [];
          renderSlip();
        })
        .catch(error => {
          console.error("Error submitting bet:", error);
          alert("Error submitting bet. See console.");
        });
    });
  }
}

function addToSlip(bet) {
  betSlip.push(bet);
  renderSlip();
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  renderSlip();
}

function renderSlip() {
  const list = document.getElementById("slip-items");
  const parlayLine = document.getElementById("parlay-line");
  const payoutLine = document.getElementById("payout-line");

  if (!list || !parlayLine || !payoutLine) return;

  list.innerHTML = "";
  betSlip.forEach((bet, index) => {
    list.innerHTML += `<li>${bet.label} @ ${bet.odds > 0 ? "+" + bet.odds : bet.odds} <button onclick="removeFromSlip(${index})">X</button></li>`;
  });

  if (betSlip.length === 0) {
    parlayLine.textContent = "";
    payoutLine.textContent = "";
    return;
  }

  let decimalOdds = betSlip.reduce((acc, bet) => {
    const odds = bet.odds;
    const decimal = odds > 0 ? (odds / 100 + 1) : (100 / Math.abs(odds) + 1);
    return acc * decimal;
  }, 1);

  const parlayAmerican = decimalOdds >= 2 ? `+${Math.round((decimalOdds - 1) * 100)}` : `-${Math.round(100 / (decimalOdds - 1))}`;
  const payout = wagerAmount * decimalOdds;

  parlayLine.innerHTML = betSlip.length === 1
    ? `<em>Single Bet</em><br>Odds: ${betSlip[0].odds} (${decimalOdds.toFixed(2)})`
    : `<em>${betSlip.length}-Leg Parlay</em><br>Combined Odds: ${parlayAmerican} (${decimalOdds.toFixed(2)})`;

  payoutLine.textContent = `Total Wager: $${wagerAmount.toFixed(2)} | Potential Return: $${payout.toFixed(2)}`;
}

// === LEADERBOARD LOADING ===
function loadWeeklyLeaderboard() {
  const gid = '1039517288';
  const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRL8lIZa71AtFnkuxWpspb2z_TuT-SkJFOcMkLTule0w1OHozYNiB-evwAnPMX2WaTLCJNe_BkvZQdj/pub?gid=${gid}&single=true&output=csv`;

  Papa.parse(url, {
    download: true,
    header: true,
    complete: function(results) {
      renderWeeklyLeaderboard(results.data);
    }
  });
}

function loadSeasonLeaderboard() {
  const gid = '399533112';
  const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRL8lIZa71AtFnkuxWpspb2z_TuT-SkJFOcMkLTule0w1OHozYNiB-evwAnPMX2WaTLCJNe_BkvZQdj/pub?gid=${gid}&single=true&output=csv`;

  Papa.parse(url, {
    download: true,
    header: true,
    complete: function(results) {
      renderSeasonLeaderboard(results.data);
    }
  });
}

function renderWeeklyLeaderboard(data) {
  const container = document.getElementById("weekly-leaderboard");
  if (!container || !data || data.length === 0) return;
  container.innerHTML = generateTableHTML(data);
}

function renderSeasonLeaderboard(data) {
  const container = document.getElementById("season-leaderboard");
  if (!container || !data || data.length === 0) return;

  const columnsToShow = [
    "Bettor", "Bankroll", "Bets Placed", "Bets Won", "Win %", "Total Wagered", "Payouts Earned"
  ];

  const filtered = data.map(row => {
    let result = {};
    columnsToShow.forEach(key => result[key] = row[key]);
    return result;
  });

  container.innerHTML = generateTableHTML(filtered);
}

function generateTableHTML(data) {
  let html = `<table class="leaderboard-table"><thead><tr>`;
  const headers = Object.keys(data[0]);
  headers.forEach(header => html += `<th>${header}</th>`);
  html += `</tr></thead><tbody>`;

  data.forEach(row => {
    html += `<tr>`;
    headers.forEach(key => html += `<td>${row[key]}</td>`);
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

function setupLeaderboardToggle() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      document.getElementById("weekly-leaderboard").style.display = (view === 'weekly') ? 'block' : 'none';
      document.getElementById("season-leaderboard").style.display = (view === 'season') ? 'block' : 'none';
    });
  });
}
