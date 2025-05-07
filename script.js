// === CONFIG ===
const SHEET_ID = "1Ub5Ey71JDvK21aFTVA3tzGDfMsGxDngVjpkbFXmnCm0";
const SCRIPT_ENDPOINT = "https://icy-thunder-2eb4.jfmccartney.workers.dev/";
const MAX_WAGER = 500;

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
const DEV_OVERRIDE_WEEK = null;

// === UTILS ===
function getCurrentNFLWeek() {
  if (DEV_OVERRIDE_WEEK !== null) return DEV_OVERRIDE_WEEK;
  const seasonStart = new Date("2025-09-02T12:00:00-04:00");
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(14, Math.max(1, diff + 1));
}

function getCSVUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=${gid}&single=true&output=csv`;
}

function fetchCSVThroughWorker(url) {
  return fetch(`${SCRIPT_ENDPOINT}?url=${encodeURIComponent(url)}`)
    .then(res => {
      if (!res.ok) throw new Error(`Worker Proxy Error: ${res.status}`);
      return res.text();
    });
}

function parseCSV(text) {
  return Papa.parse(text, { header: true }).data;
}

// === STATE ===
let currentUser = null;
let currentBankroll = 0;
let currentWeek = getCurrentNFLWeek();
let betSlip = [];

// === DOM READY ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("SCRIPT LOADED ✅");
  const path = window.location.pathname;
  console.log("Path:", path);

  if (path.endsWith("bet.html")) {
    initBetPage();
  }
});

// === INIT BET PAGE ===
function initBetPage() {
  console.log("Running bet page init...");

  currentUser = localStorage.getItem("bobbybets_user");
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-name").textContent = currentUser;

  // Load bankroll
  const bankrollUrl = getCSVUrl(BANKROLL_GID);
  fetchCSVThroughWorker(bankrollUrl)
    .then(text => {
      const rows = parseCSV(text);
      const userRow = rows.find(r => r.Bettor?.trim().toLowerCase() === currentUser.trim().toLowerCase());
      if (userRow) {
        currentBankroll = parseFloat(userRow.Bankroll.replace(/[^0-9.-]+/g, ""));
        document.getElementById("bankroll").textContent = `$${currentBankroll.toFixed(2)}`;
      } else {
        throw new Error("User not found in bankroll sheet");
      }
    })
    .catch(err => {
      console.error("Bankroll load error:", err);
      alert("Failed to load bankroll");
    });

  // Load current week matchups
  const gid = WEEK_GID_MAP[currentWeek];
  const weekUrl = getCSVUrl(gid);
  fetchCSVThroughWorker(weekUrl)
    .then(text => {
      const rows = parseCSV(text);
      displayMatchups(rows);
    })
    .catch(err => {
      console.error("Matchup load error:", err);
      alert("Failed to load matchups");
    });

  // Wire up buttons
  document.getElementById("reset-slip").addEventListener("click", resetSlip);
  document.getElementById("submit-slip").addEventListener("click", submitSlip);
}

// === DISPLAY MATCHUPS ===
function displayMatchups(games) {
  const container = document.getElementById("matchups");
  container.innerHTML = "";
  games.forEach((g, i) => {
    const div = document.createElement("div");
    div.className = "matchup";

    const label = document.createElement("div");
    label.textContent = `${g.TeamA} vs ${g.TeamB}`;
    div.appendChild(label);

    ["SpreadA", "SpreadB", "Over", "Under"].forEach(key => {
      const btn = document.createElement("button");
      const val = g[key];
      if (!val) return;

      btn.textContent = `${key.includes("Spread") ? (key === "SpreadA" ? g.TeamA : g.TeamB) : key.toUpperCase()} ${val}`;
      btn.addEventListener("click", () => addToSlip({
        type: key.includes("Spread") ? "Spread" : "Total",
        selection: btn.textContent,
        odds: -110
      }));
      div.appendChild(btn);
    });

    container.appendChild(div);
  });
}

// === SLIP ACTIONS ===
function addToSlip(bet) {
  betSlip.push(bet);
  renderSlip();
}

function resetSlip() {
  betSlip = [];
  renderSlip();
}

function renderSlip() {
  const slip = document.getElementById("bet-slip-contents");
  slip.innerHTML = "";

  betSlip.forEach((b, i) => {
    const row = document.createElement("div");
    row.className = "slip-row";
    row.textContent = `${b.type}: ${b.selection} (${b.odds})`;

    const x = document.createElement("button");
    x.textContent = "❌";
    x.onclick = () => {
      betSlip.splice(i, 1);
      renderSlip();
    };
    row.appendChild(x);
    slip.appendChild(row);
  });
}

// === SUBMIT SLIP ===
function submitSlip() {
  const wager = parseFloat(document.getElementById("wager").value);
  if (isNaN(wager) || wager <= 0 || wager > currentBankroll || wager > MAX_WAGER) {
    alert("Invalid wager amount");
    return;
  }
  if (betSlip.length === 0) {
    alert("No bets on the slip");
    return;
  }

  const payload = {
    bettor: currentUser,
    week: currentWeek,
    timestamp: new Date().toISOString(),
    wager: wager,
    bets: betSlip
  };

  fetch(SCRIPT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.text())
    .then(txt => {
      if (txt.includes("Success")) {
        alert("Bet submitted!");
        resetSlip();
        location.reload();
      } else {
        alert("Submission failed: " + txt);
      }
    })
    .catch(err => {
      console.error("Submit error:", err);
      alert("Error submitting bet");
    });
}
