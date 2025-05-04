// === WEEK CONFIGURATION ===
const WEEK_GID_MAP = {
  1: "0",
  2: "202324890",
  3: "441155668",
  4: "1793741269",
  5: "1409141359",
  6: "1172649228",
  7: "1722653524",
  8: "2095287272",
  9: "412313481",
  10: "1159601837",
  11: "1864571679",
  12: "480970597",
  13: "285082386",
  14: "858725653"
};

function getCurrentNFLWeek() {
  const week1Start = new Date("2025-09-02T12:00:00"); // Tuesday, Noon
  const now = new Date();
  const diffMs = now - week1Start;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const week = Math.floor(diffMs / oneWeekMs) + 1;
  return Math.min(Math.max(week, 1), 14); // Cap at Week 14
}

const DEV_OVERRIDE_WEEK = 1; // Set to null to use live logic
const currentWeek = DEV_OVERRIDE_WEEK || getCurrentNFLWeek();
const matchupGID = WEEK_GID_MAP[currentWeek];
const MATCHUP_CSV = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=${matchupGID}&single=true&output=csv`;

const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycby5cF6WZGXv7Yg_39wNLrzU6t5D5ofLXB-NH1ebv16Z9OGY5CSdDrR9_tyBOW7PQE2g/exec";


let currentUser = localStorage.getItem("bobbybets_user");
let betSlip = [];
let wagerAmount = 50;

document.getElementById("user-name").textContent = currentUser || "Unknown";
const weekLabel = document.createElement("p");
weekLabel.innerHTML = `<strong>Current NFL Week:</strong> ${currentWeek}`;
document.body.insertBefore(weekLabel, document.getElementById("matchups"));

Papa.parse(MATCHUP_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const matchupsDiv = document.getElementById("matchups");

    data.forEach((row, i) => {
      if (!row["Team A"] || !row["Team B"]) return;

      const teamA = row["Team A"].trim();
      const teamB = row["Team B"].trim();
      const spread = row["Spread"];
      const mlA = parseInt(row["Moneyline A"]);
      const mlB = parseInt(row["Moneyline B"]);
      const spreadOddsA = parseInt(row["Spread Odds A"]);
      const spreadOddsB = parseInt(row["Spread Odds B"]);

      const container = document.createElement("div");

      const makeButton = (label, odds, type) => {
        return `<button onclick='addToSlip(${JSON.stringify({ label, odds: Number(odds), type })})'>
          ${label} (${odds > 0 ? "+" + odds : odds})
        </button>`;
      };

      const overOdds = Number(row["Over Odds"]) || -110;
      const underOdds = Number(row["Under Odds"]) || -110;
      const totalPoints = row["Over/Under Line"] || "";

      container.innerHTML = `
        <h3>Game ${i + 1}: ${teamA} vs ${teamB}</h3>
        ${makeButton(`${teamA} ${spread}`, spreadOddsA, "spread")}
        ${makeButton(`${teamB} ${spread}`, spreadOddsB, "spread")}
        ${makeButton(`${teamA} ML`, mlA, "ml")}
        ${makeButton(`${teamB} ML`, mlB, "ml")}
        ${makeButton(`OVER ${totalPoints}`, overOdds, "over")}
        ${makeButton(`UNDER ${totalPoints}`, underOdds, "under")}
      `;

      matchupsDiv.appendChild(container);
    });
  }
});

Papa.parse(BANKROLL_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const userRow = data.find(row => row.Bettor?.trim().toLowerCase() === currentUser?.trim().toLowerCase());
    const bankroll = userRow ? parseFloat(userRow.Bankroll.replace(/[\$,]/g, '')) || 0 : 0;
    document.getElementById("bankroll").textContent = bankroll.toFixed(2);
  }
});

function addToSlip(betObj) {
  betSlip.push(betObj);
  renderSlip();
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  renderSlip();
}

function renderSlip() {
  const list = document.getElementById("slip-items");
  list.innerHTML = "";

  betSlip.forEach((bet, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      ${bet.label} @ ${bet.odds > 0 ? "+" + bet.odds : bet.odds}
      <button onclick="removeFromSlip(${index})">X</button>
    `;
    list.appendChild(item);
  });

  const parlayLine = document.getElementById("parlay-line");
  const payoutLine = document.getElementById("payout-line");

  if (betSlip.length === 0) {
    parlayLine.textContent = "";
    payoutLine.textContent = "";
    return;
  }

  let decimalOdds = 1;
  betSlip.forEach(bet => {
    const odds = parseInt(bet.odds);
    const decimal = odds > 0 ? (odds / 100 + 1) : (100 / Math.abs(odds) + 1);
    decimalOdds *= decimal;
  });

  const parlayAmerican = decimalOdds >= 2
    ? `+${Math.round((decimalOdds - 1) * 100)}`
    : `-${Math.round(100 / (decimalOdds - 1))}`;

  const payout = wagerAmount * decimalOdds;

  if (betSlip.length === 1) {
    parlayLine.innerHTML = `<em>Single Bet</em><br>Odds: ${betSlip[0].odds} (${decimalOdds.toFixed(2)})`;
  } else {
    parlayLine.innerHTML = `<em>${betSlip.length}-Leg Parlay</em><br>Combined Odds: ${parlayAmerican} (${decimalOdds.toFixed(2)})`;
  }

  payoutLine.textContent = `Total Wager: $${wagerAmount.toFixed(2)} | Potential Return: $${payout.toFixed(2)}`;
}

document.getElementById("wager-input").addEventListener("change", (e) => {
  wagerAmount = parseFloat(e.target.value);
  renderSlip();
});

document.getElementById("reset-slip").addEventListener("click", () => {
  betSlip = [];
  renderSlip();
});

document.getElementById("submit-bet").addEventListener("click", () => {
  if (!currentUser || betSlip.length === 0) return alert("Invalid bet or user");

  fetch(SCRIPT_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: currentUser,
      bets: betSlip,
      wager: wagerAmount
    })
  });

  alert("Bet submitted!");
  betSlip = [];
  renderSlip();
});
