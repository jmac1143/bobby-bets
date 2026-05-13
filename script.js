// === BOBBY BETS CORE SCRIPT (Production Version) ===
console.log("SCRIPT LOADED ✅");

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.includes("bet.html")) {
    initBetPage();
  }
});

// === CONFIG ===
const SCRIPT_ENDPOINT = "https://icy-thunder-2eb4.jfmccartney.workers.dev/";
const MAX_WAGER = 500;
const SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=";

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

const BANKROLL_GID = "399533112";

// Set this to a number like 1, 2, 3, etc. if you ever want to force-test a week.
// Leave it as null for automatic week selection.
const DEV_OVERRIDE_WEEK = null;

// 2026 Bobby Bets regular season starts Tuesday, September 8, 2026 at noon.
// Every Tuesday at noon, the app rolls to the next betting week.
const SEASON_START_DATE = new Date("2026-09-08T12:00:00");
const MAX_REGULAR_SEASON_WEEK = 14;

function getCurrentNFLWeek() {
  if (DEV_OVERRIDE_WEEK !== null) return DEV_OVERRIDE_WEEK;

  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const delta = now - SEASON_START_DATE;

  return Math.max(
    1,
    Math.min(MAX_REGULAR_SEASON_WEEK, Math.floor(delta / msPerWeek) + 1)
  );
}

let currentUser = localStorage.getItem("bobbybets_user");
let betSlip = [];
let wagerAmount = 50;

// === INIT BET PAGE ===
function initBetPage() {
  if (!currentUser) {
    alert("You must log in through the homepage.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-name").textContent = currentUser;

  const weekNum = getCurrentNFLWeek();
  const weekLabel = document.getElementById("current-week-label");
if (weekLabel) {
  weekLabel.innerHTML = `<strong>Current Betting Week:</strong> Week ${weekNum}`;
}
  const MATCHUP_CSV = `${SCRIPT_ENDPOINT}?url=${encodeURIComponent(SHEET_BASE_URL + WEEK_GID_MAP[weekNum] + "&single=true&output=csv")}`;
  const BANKROLL_CSV = `${SCRIPT_ENDPOINT}?url=${encodeURIComponent(SHEET_BASE_URL + BANKROLL_GID + "&single=true&output=csv")}`;

  // === Load Bankroll ===
  Papa.parse(BANKROLL_CSV, {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const userRow = data.find(row => row.Bettor?.trim().toLowerCase() === currentUser?.toLowerCase());
      const bankroll = userRow ? parseFloat(userRow.Bankroll.replace(/[$,]/g, "")) || 0 : 0;
      const currentDisplay = parseFloat(document.getElementById("bankroll").textContent.replace(/[$,]/g, "")) || 0;
      animateBankrollUpdate(currentDisplay, bankroll);
    }
  });

  // === Load Matchups ===
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

        const createButton = (label, odds, type, context = "") => {
          const btn = document.createElement("button");
          btn.className = "bet-btn";
          btn.textContent = `${label} (${odds > 0 ? "+" + odds : odds})`;
          btn.addEventListener("click", () =>
            addToSlip({
              selection: `${label}${context ? " – " + context : ""}`,
              odds,
              type
            })
          );
          return btn;
        };

        const container = document.createElement("div");
        container.className = "matchup-card";
        container.innerHTML = `<h3>Game ${i + 1}: ${teamA} vs ${teamB}</h3>`;

        const optionsDiv = document.createElement("div");
        optionsDiv.className = "bet-options";

        const spreadVal = parseFloat(spread);

        optionsDiv.appendChild(
          createButton(
            `${teamA} ${spreadVal > 0 ? "-" + spreadVal : spreadVal}`,
            spreadOddsA,
            "spread"
          )
        );

        optionsDiv.appendChild(
          createButton(
            `${teamB} ${spreadVal > 0 ? "+" + spreadVal : -spreadVal}`,
            spreadOddsB,
            "spread"
          )
        );

        optionsDiv.appendChild(createButton(`${teamA} ML`, mlA, "ml"));
        optionsDiv.appendChild(createButton(`${teamB} ML`, mlB, "ml"));

        const gameLabel = `${teamA} vs ${teamB}`;

        optionsDiv.appendChild(createButton(`OVER ${totalPoints}`, overOdds, "over", gameLabel));
        optionsDiv.appendChild(createButton(`UNDER ${totalPoints}`, underOdds, "under", gameLabel));

        container.appendChild(optionsDiv);
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

  document.getElementById("reset-slip")?.addEventListener("click", () => {
    betSlip = [];
    renderSlip();
  });

  document.getElementById("submit-bet")?.addEventListener("click", () => {
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
      bets: betSlip.map(b => ({
        type: b.type,
        selection: b.selection,
        odds: Number(b.odds)
      })),
      wager: wagerAmount,
      timestamp,
      week
    };

    const decimalOdds = betSlip.reduce((acc, bet) => {
      const odds = bet.odds;
      const decimal = odds > 0
        ? odds / 100 + 1
        : 100 / Math.abs(odds) + 1;

      return acc * decimal;
    }, 1);

    fetch(SCRIPT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.text())
      .then(() => {
        const slip = document.getElementById("confirmation-slip");

        if (slip) {
          const selections = betSlip
            .map(b => `• ${b.selection} (${b.odds > 0 ? "+" : ""}${b.odds})`)
            .join("<br>");

          const returnAmount = (wagerAmount * decimalOdds).toFixed(2);

          slip.innerHTML = `
            <strong>🧾 BET CONFIRMED!</strong><br><br>
            🧍 ${currentUser}<br>
            📆 Week ${getCurrentNFLWeek()} – ${timestamp}<br><br>
            🎯 Selections:<br>${selections}<br><br>
            💵 Wager: $${wagerAmount.toFixed(2)}<br>
            💰 Potential Return: $${returnAmount}
          `;

          const newPending = {
            Timestamp: timestamp,
            Bettor: currentUser,
            Week: getCurrentNFLWeek(),
            Selections: betSlip
              .map(b => `${b.selection} (${b.odds > 0 ? "+" : ""}${b.odds})`)
              .join(", "),
            Wager: `$${wagerAmount.toFixed(2)}`,
            Return: `$${(wagerAmount * decimalOdds).toFixed(2)}`,
            Status: "Pending"
          };

          appendPendingSlip(newPending);

          slip.classList.remove("hidden");
          setTimeout(() => slip.classList.add("hidden"), 7000);
        }

        betSlip = [];
        renderSlip();
      })
      .catch(error => {
        console.error("Error submitting bet:", error);
        alert("Error submitting bet. See console.");
      });
  });

  loadPendingSlips();
  loadBetHistory();
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
    list.innerHTML += `
      <li>
        ${bet.selection} @ ${bet.odds > 0 ? "+" + bet.odds : bet.odds}
        <button onclick="removeFromSlip(${index})">X</button>
      </li>
    `;
  });

  if (betSlip.length === 0) {
    parlayLine.textContent = "";
    payoutLine.textContent = "";
    return;
  }

  const decimalOdds = betSlip.reduce((acc, bet) => {
    const odds = bet.odds;
    const decimal = odds > 0
      ? odds / 100 + 1
      : 100 / Math.abs(odds) + 1;

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

function adjustWager(delta) {
  const input = document.getElementById("wager-input");
  let value = parseInt(input.value) || 0;

  value = Math.min(Math.max(1, value + delta), MAX_WAGER);

  input.value = value;
  wagerAmount = value;

  renderSlip();
}

function animateBankrollUpdate(oldValue, newValue) {
  const display = document.getElementById("bankroll");
  if (!display) return;

  const isGain = newValue > oldValue;
  const duration = 1500;
  const start = performance.now();
  const difference = newValue - oldValue;

  display.classList.remove("bankroll-gain", "bankroll-loss");
  display.classList.add(isGain ? "bankroll-gain" : "bankroll-loss");

  function updateFrame(timestamp) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = oldValue + difference * progress;

    display.textContent = current.toLocaleString(undefined, {
      minimumFractionDigits: 2
    });

    if (progress < 1) {
      requestAnimationFrame(updateFrame);
    } else {
      setTimeout(() => {
        display.classList.remove("bankroll-gain", "bankroll-loss");
      }, 500);
    }
  }

  requestAnimationFrame(updateFrame);
}

function loadPendingSlips() {
  if (!currentUser) return;

  const PENDING_GID = "2135863399";
  const pendingURL = `${SCRIPT_ENDPOINT}?url=${encodeURIComponent(SHEET_BASE_URL + PENDING_GID + "&single=true&output=csv")}`;

  Papa.parse(pendingURL, {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const userSlips = data.filter(row =>
        row.Bettor?.trim().toLowerCase() === currentUser.toLowerCase()
      );

      const container = document.getElementById("pending-slips");
      if (!container) return;

      if (userSlips.length === 0) {
        container.innerHTML = "<p>No pending bets yet.</p>";
        return;
      }

      container.innerHTML = "";

      userSlips.forEach(slip => {
        const card = document.createElement("div");
        card.className = "bet-card";

        const rawReturn = slip.Return || slip["Potential Return"] || slip.Payout || "";
        const returnAmount = parseFloat(rawReturn.toString().replace(/[^0-9.]/g, "")) || 0;

        card.innerHTML = `
          <strong>📅 ${slip.Timestamp}</strong><br>
          📆 <span>Week ${slip.Week} – <em>${slip.Status}</em></span><br><br>
          🎯 <strong>Selections:</strong><br>
          ${slip.Selections.replace(/, /g, "<br>")}<br><br>
          💵 <span class="amount">Wager: ${slip.Wager}</span><br>
          💰 <span class="amount">Potential Return: $${returnAmount.toFixed(2)}</span>
        `;

        container.appendChild(card);
      });
    }
  });
}

function appendPendingSlip(slip) {
  const container = document.getElementById("pending-slips");
  if (!container) return;

  const card = document.createElement("div");
  card.className = "bet-card";

  const rawReturn = slip.Return || "";
  const returnAmount = parseFloat(rawReturn.toString().replace(/[^0-9.]/g, "")) || 0;

  card.innerHTML = `
    <strong>📅 ${slip.Timestamp}</strong><br>
    📆 Week ${slip.Week} – <em>${slip.Status}</em><br><br>
    🎯 Selections:<br>${slip.Selections.replace(/, /g, "<br>")}<br><br>
    💵 Wager: ${slip.Wager}<br>
    💰 Potential Return: $${returnAmount.toFixed(2)}
  `;

  container.prepend(card);
}

function loadBetHistory() {
  if (!currentUser) return;

  const BETS_GID = "362709623";
  const BETS_CSV = `${SCRIPT_ENDPOINT}?url=${encodeURIComponent(SHEET_BASE_URL + BETS_GID + "&single=true&output=csv")}`;

  Papa.parse(BETS_CSV, {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;

      const userBets = data.filter(row =>
        row.Bettor?.trim().toLowerCase() === currentUser.toLowerCase()
      );

      const grouped = {};

      userBets.forEach(row => {
        const pid = row["Parlay ID"];
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(row);
      });

      const container = document.getElementById("bet-history");
      if (!container) return;

      container.innerHTML = "";

      Object.keys(grouped).reverse().forEach(pid => {
        const slip = grouped[pid];
        const first = slip[0];
        const selections = slip.map(b => `${b.Selection} (${b.Odds})`).join("<br>");

        const payout = parseFloat((first.Payout || "").toString().replace(/[^0-9.]/g, "")) || 0;
        const wager = parseFloat(first.Wager || 0);
        const status = first.Status || "In Progress";
        const result = first.Result || "-";

        let resultIcon = "";
        let resultClass = "result-pending";

        if (result === "WIN") {
          resultIcon = "✅";
          resultClass = "result-win";
        } else if (result === "LOSS") {
          resultIcon = "❌";
          resultClass = "result-loss";
        } else if (result === "PUSH") {
          resultIcon = "➖";
          resultClass = "result-push";
        } else {
          resultIcon = "⏳";
        }

        const card = document.createElement("div");
        card.className = "bet-card";

        card.innerHTML = `
          <strong>📅 ${first.Timestamp}</strong><br>
          📆 Week ${first.Week} — <em>${status}</em><br><br>
          🧾 ${pid} — ${slip.length}-leg Parlay<br>
          🎯 Selections:<br>${selections}<br><br>
          💵 Wager: $${wager.toFixed(2)}<br>
          💰 Payout: $${payout.toFixed(2)}<br>
          <span class="${resultClass}">${resultIcon} Result: ${result}</span>
        `;

        container.appendChild(card);
      });
    }
  });
}
