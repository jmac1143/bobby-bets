const MATCHUP_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXfWGY8hF83ATkT-hKLiowaJ1yp4GHYy5z5CJf0t3XlSG8exS-/exec";

let currentUser = localStorage.getItem('bobbybets_user');
let betSlip = [];
let wagerAmount = 50;

// Display user
document.getElementById("user-name").textContent = currentUser || "Unknown";

// Bankroll
fetch(BANKROLL_CSV)
  .then(res => res.text())
  .then(text => {
    const rows = Papa.parse(text, { header: true }).data;
    const row = rows.find(r => r.Bettor?.trim() === currentUser?.trim());
    const bankroll = row ? parseFloat(row.Bankroll.replace('$', '')) : 0;
    document.getElementById("bankroll").textContent = bankroll.toFixed(2);
  });

// Matchups
fetch(MATCHUP_CSV)
  .then(res => res.text())
  .then(text => {
    const data = Papa.parse(text, { header: true }).data;
    const container = document.getElementById("matchups");
    data.forEach((game, index) => {
      if (!game["Team A"]) return;
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>Game ${index + 1}: ${game["Team A"]} vs ${game["Team B"]}</h3>
        <button onclick="addToSlip('${game["Team A"]} ${game["Spread A"]}')">${game["Team A"]} ${game["Spread A"]}</button>
        <button onclick="addToSlip('${game["Team B"]} ${game["Spread B"]}')">${game["Team B"]} ${game["Spread B"]}</button>
        <button onclick="addToSlip('${game["Team A"]} ML')">${game["Team A"]} ML</button>
        <button onclick="addToSlip('${game["Team B"]} ML')">${game["Team B"]} ML</button>
        <button onclick="addToSlip('OVER ${game["Over/Under"]}')">OVER ${game["Over/Under"]}</button>
        <button onclick="addToSlip('UNDER ${game["Over/Under"]}')">UNDER ${game["Over/Under"]}</button>
      `;
      container.appendChild(div);
    });
  });

function addToSlip(bet) {
  if (!betSlip.includes(bet)) {
    betSlip.push(bet);
    renderBetSlip();
  }
}

function renderBetSlip() {
  const slipDiv = document.getElementById("bet-slip");
  const wagerInput = document.getElementById("wager-input");
  wagerAmount = parseFloat(wagerInput.value);
  slipDiv.innerHTML = `
    <h3>Bet Slip</h3>
    <ul>${betSlip.map(b => `<li>${b} <button onclick="removeFromSlip('${b}')">X</button></li>`).join('')}</ul>
    <p>Wager: $<input id="wager-input" type="number" value="${wagerAmount}" min="1" /></p>
    <button id="reset-slip">Reset Slip</button>
    <button id="submit-bet">Submit Bet</button>
  `;

  document.getElementById("reset-slip").onclick = () => {
    betSlip = [];
    renderBetSlip();
  };

  document.getElementById("submit-bet").onclick = () => {
    const user = localStorage.getItem('bobbybets_user');
    const wager = parseFloat(document.getElementById("wager-input").value);

    if (!user || betSlip.length === 0 || isNaN(wager) || wager <= 0) {
      alert("Invalid bet or user.");
      return;
    }

    fetch(SCRIPT_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        user,
        wager,
        bets: betSlip
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.text())
    .then(data => {
      alert("Bet submitted!");
      betSlip = [];
      renderBetSlip();
      location.reload();
    })
    .catch(err => {
      console.error("Error submitting bet:", err);
      alert("Failed to submit.");
    });
  };
}

function removeFromSlip(bet) {
  betSlip = betSlip.filter(b => b !== bet);
  renderBetSlip();
}
