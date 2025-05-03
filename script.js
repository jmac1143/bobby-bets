// Updated script.js with accurate sheet headers and logic

const MATCHUP_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?output=csv";
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXFWGY8hF83ATkT-hKLiowa31yp4GHYy5z5CJf0t3XISG8eXS-/exec";

let currentUser = localStorage.getItem('bobbybets_user');
let betSlip = [];
let bankroll = 0;
let wagerAmount = 50;

// Display username
const userDisplay = document.getElementById('user-name');
if (userDisplay) userDisplay.textContent = currentUser || 'Unknown';

// Fetch and display matchups
Papa.parse(MATCHUP_CSV, {
  download: true,
  header: true,
  complete: function(results) {
    const matchups = results.data;
    const matchupsContainer = document.getElementById("matchups");
    matchups.forEach((row, i) => {
      const gameDiv = document.createElement("div");
      gameDiv.className = "matchup";
      gameDiv.innerHTML = `
        <h3>Game ${i + 1}: ${row["Team A"]} vs ${row["Team B"]}</h3>
        <button onclick="addToSlip('${row["Team A"]} +${row["Spread"]}')">${row["Team A"]} +${row["Spread"]}</button>
        <button onclick="addToSlip('${row["Team B"]} -${row["Spread"]}')">${row["Team B"]} -${row["Spread"]}</button>
        <button onclick="addToSlip('${row["Team A"]} ML')">${row["Team A"]} ML</button>
        <button onclick="addToSlip('${row["Team B"]} ML')">${row["Team B"]} ML</button>
        <button onclick="addToSlip('OVER ${row["Over Odds"]}')">OVER ${row["Over Odds"]}</button>
        <button onclick="addToSlip('UNDER ${row["Under Odds"]}')">UNDER ${row["Under Odds"]}</button>
      `;
      matchupsContainer.appendChild(gameDiv);
    });
  }
});

// Fetch bankroll
Papa.parse(BANKROLL_CSV, {
  download: true,
  header: true,
  complete: function(results) {
    const rows = results.data;
    const userRow = rows.find(r => r.User?.trim() === currentUser);
    bankroll = userRow ? parseFloat(userRow.Balance || "0") : 0;
    const bankrollEl = document.getElementById("bankroll");
    if (bankrollEl) bankrollEl.textContent = bankroll.toFixed(2);
  }
});

function addToSlip(betText) {
  betSlip.push(betText);
  renderSlip();
}

function renderSlip() {
  const slipEl = document.getElementById("betSlip");
  slipEl.innerHTML = '<h3>Bet Slip</h3><ul>' + betSlip.map((bet, i) => `<li>${bet} <button onclick="removeFromSlip(${i})">X</button></li>`).join('') + '</ul>' +
    `<label>Wager: $<input type="number" id="wagerInput" value="${wagerAmount}" onchange="updateWager(this.value)" /></label><br>
    <button onclick="resetSlip()">Reset Slip</button>
    <button onclick="submitSlip()">Submit Bet</button>`;
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  renderSlip();
}

function resetSlip() {
  betSlip = [];
  renderSlip();
}

function updateWager(value) {
  wagerAmount = parseFloat(value) || 0;
}

function submitSlip() {
  if (!currentUser || betSlip.length === 0 || wagerAmount <= 0 || wagerAmount > bankroll) {
    alert("Check your user, bet slip, or wager amount.");
    return;
  }

  fetch(SCRIPT_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      user: currentUser,
      bets: betSlip,
      amount: wagerAmount
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.text())
  .then(data => {
    alert("Bet submitted!");
    resetSlip();
    location.reload();
  })
  .catch(err => alert("Error submitting bet."));
}
