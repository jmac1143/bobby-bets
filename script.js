const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKkrO3IGiK1iPnqcP1S56GhopZzzkYqD9TS-W7Avn8I9WIt6vOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=1476766586&single=true&output=csv";
const scriptUrl = "https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXFWGY8hF83ATkT-hKLiowaJ1yp4GHYy5z5cJf0t3XlSG8exS-/exec";

let loggedInUser = localStorage.getItem("loggedInUser");
let currentBankroll = 0;
let betSlip = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcome").textContent = `Welcome, ${loggedInUser}`;
  fetchBankroll();
  fetchMatchups();
  updateBetSlip();
});

function fetchBankroll() {
  fetch(sheetUrl)
    .then(response => response.text())
    .then(data => {
      const rows = data.split("\n").map(row => row.split(","));
      const headers = rows[0];
      const bettorIndex = headers.indexOf("Bettor");
      const bankrollIndex = headers.indexOf("Bankroll");

      for (let i = 1; i < rows.length; i++) {
        const name = rows[i][bettorIndex]?.trim();
        if (name === loggedInUser) {
          let value = rows[i][bankrollIndex].replace(/[$,]/g, "").trim();
          currentBankroll = parseFloat(value) || 0;
          break;
        }
      }

      document.getElementById("bankroll-display").textContent = `Bankroll: $${currentBankroll.toFixed(2)}`;
    });
}

function fetchMatchups() {
  Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKk...YOUR_MATCHUP_CSV_LINK.../pub?gid=0&single=true&output=csv", {
    download: true,
    header: true,
    complete: function (results) {
      displayMatchups(results.data);
    }
  });
}

function displayMatchups(games) {
  const container = document.getElementById("matchups");
  container.innerHTML = "";

  games.forEach(game => {
    const teamA = game["Team A"];
    const teamB = game["Team B"];
    const spread = parseFloat(game["Spread"]) || 0;

    const spreadA = spread > 0 ? `-${spread}` : `+${Math.abs(spread)}`;
    const spreadB = spread > 0 ? `+${spread}` : `-${Math.abs(spread)}`;

    container.innerHTML += `
      <div class="game">
        <button onclick="addToSlip('${teamA}', 'Spread', ${spreadA})">${teamA} ${spreadA}</button>
        <button onclick="addToSlip('${teamB}', 'Spread', ${spreadB})">${teamB} ${spreadB}</button>
        <button onclick="addToSlip('${teamA}', 'ML', 'ML')">${teamA} ML</button>
        <button onclick="addToSlip('${teamB}', 'ML', 'ML')">${teamB} ML</button>
        <button onclick="addToSlip('OVER', 'Total', ${game["Over/Under"]})">OVER ${game["Over/Under"]}</button>
        <button onclick="addToSlip('UNDER', 'Total', ${game["Over/Under"]})">UNDER ${game["Over/Under"]}</button>
      </div>
    `;
  });
}

function addToSlip(team, type, value) {
  betSlip.push({ team, type, value });
  updateBetSlip();
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  updateBetSlip();
}

function resetSlip() {
  betSlip = [];
  updateBetSlip();
}

function updateBetSlip() {
  const slip = document.getElementById("bet-slip");
  slip.innerHTML = `
    <div>Bankroll: <span id="bankroll-display">$${currentBankroll.toFixed(2)}</span></div>
    <label>Wager: <input id="wager-input" type="number" value="50" min="1" max="${currentBankroll}" /></label>
    <div id="bet-list">${betSlip.map((b, i) => `
      <div>${b.team}: ${b.type} ${b.value} 
        <button onclick="removeFromSlip(${i})">x</button>
      </div>
    `).join("")}</div>
    <button onclick="resetSlip()">Reset Slip</button>
    <button onclick="submitSlip()">Submit Bet</button>
  `;
}

function submitSlip() {
  const wager = parseFloat(document.getElementById("wager-input").value);
  if (wager > currentBankroll) {
    alert("Not enough bankroll!");
    return;
  }

  fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify({
      user: loggedInUser,
      wager: wager,
      slip: betSlip
    }),
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => {
    if (res.ok) {
      alert("Bet submitted!");
      currentBankroll -= wager;
      resetSlip();
      updateBetSlip();
    } else {
      alert("Error submitting bet.");
    }
  });
}
