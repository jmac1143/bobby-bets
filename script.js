// === CONFIG ===
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://icy-thunder-2eb4.jfmccartney.workers.dev/";

// === WEEK GID MAP ===
const WEEK_GID_MAP = {
  1: "0", 2: "202324890", 3: "441155668", 4: "1793741269", 5: "1409141359",
  6: "1172649228", 7: "1722653524", 8: "2095287272", 9: "412313481",
  10: "1159601837", 11: "1864571679", 12: "480970597", 13: "285082386", 14: "858725653"
};

// === DEV WEEK OVERRIDE ===
const DEV_OVERRIDE_WEEK = null;

function getCurrentNFLWeek() {
  if (DEV_OVERRIDE_WEEK !== null) return DEV_OVERRIDE_WEEK;

  const startDates = [
    "2025-09-02T12:00:00", "2025-09-09T12:00:00", "2025-09-16T12:00:00",
    "2025-09-23T12:00:00", "2025-09-30T12:00:00", "2025-10-07T12:00:00",
    "2025-10-14T12:00:00", "2025-10-21T12:00:00", "2025-10-28T12:00:00",
    "2025-11-04T12:00:00", "2025-11-11T12:00:00", "2025-11-18T12:00:00",
    "2025-11-25T12:00:00", "2025-12-02T12:00:00"
  ];

  const now = new Date();
  for (let i = startDates.length - 1; i >= 0; i--) {
    if (now >= new Date(startDates[i])) return i + 1;
  }
  return 1;
}

// === LOAD DATA ===
const weekNum = getCurrentNFLWeek();
const gid = WEEK_GID_MAP[weekNum];
const MATCHUP_CSV = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=${gid}&single=true&output=csv`;

let currentUser = localStorage.getItem("bobbybets_user");
let betSlip = [];
let wagerAmount = 50;

document.getElementById("user-name").textContent = currentUser || "Unknown";

// === LOAD MATCHUPS ===
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
      const overOdds = parseInt(row["Over Odds"]) || -110;
      const underOdds = parseInt(row["Under Odds"]) || -110;
      const totalPoints = row["Over/Under Line"] || "";

      const makeButton = (label, odds, type) => `
        <button onclick='addToSlip(${JSON.stringify({ label, odds, type })})'>
          ${label} (${odds > 0 ? "+" + odds : odds})
        </button>
      `;

      const container = document.createElement("div");
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

// === LOAD BANKROLL ===
Papa.parse(BANKROLL_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const userRow = data.find(row => row.Bettor?.trim().toLowerCase() === currentUser?.toLowerCase());
    const bankroll = userRow ? parseFloat(userRow.Bankroll.replace(/[$,]/g, '')) || 0 : 0;
    document.getElementById("bankroll").textContent = bankroll.toFixed(2);
  }
});

// === BET SLIP ===
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
  list.innerHTML = "";

  betSlip.forEach((bet, index) => {
    list.innerHTML += `
      <li>${bet.label} @ ${bet.odds > 0 ? "+" + bet.odds : bet.odds}
        <button onclick="removeFromSlip(${index})">X</button>
      </li>`;
  });

  const parlayLine = document.getElementById("parlay-line");
  const payoutLine = document.getElementById("payout-line");

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

  const parlayAmerican = decimalOdds >= 2
    ? `+${Math.round((decimalOdds - 1) * 100)}`
    : `-${Math.round(100 / (decimalOdds - 1))}`;

  const payout = wagerAmount * decimalOdds;

  parlayLine.innerHTML = betSlip.length === 1
    ? `<em>Single Bet</em><br>Odds: ${betSlip[0].odds} (${decimalOdds.toFixed(2)})`
    : `<em>${betSlip.length}-Leg Parlay</em><br>Combined Odds: ${parlayAmerican} (${decimalOdds.toFixed(2)})`;

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
  if (!currentUser || betSlip.length === 0) {
    alert("Invalid bet or user");
    return;
  }

  const timestamp = new Date().toLocaleString();
  const week = getCurrentNFLWeek();

  const payload = {
    bettor: currentUser,
    bets: betSlip.map(bet => ({
      type: bet.type,
      selection: bet.label,
      odds: Number(bet.odds)
    })),
    wager: wagerAmount,
    timestamp,
    week
  };

  console.log("Submitting Payload:", payload); // ✅ Debugging help

  fetch(SCRIPT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.text())
  .then(response => {
    console.log("Success:", response);
    alert("Bet submitted!");
    betSlip = [];
    renderSlip();
  })
  .catch(error => {
    console.error("Error submitting bet:", error);
    alert("Error submitting bet. Check console.");
  });
});
