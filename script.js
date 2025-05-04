// === CONFIG: Sheet URLs ===
const MATCHUP_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbyxG9FNe2oKdqxfdcqBXfWGy8hF83ATkT-hKLiowa3Iyp4GHY5z5CJf0t3XISG8exS/exec"; // replace with your actual Apps Script URL

// === Globals ===
let currentUser = localStorage.getItem("bobbybets_user");
let betSlip = [];
let wagerAmount = 50;

// === Update Username ===
document.getElementById("user-name").textContent = currentUser || "Unknown";

// === Fetch Matchups ===
Papa.parse(MATCHUP_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const matchupsDiv = document.getElementById("matchups");

    data.forEach((row, i) => {
      if (!row["Team A"] || !row["Team B"]) return;

      const container = document.createElement("div");
      container.innerHTML = `
        <h3>Game ${i + 1}: ${row["Team A"]} vs ${row["Team B"]}</h3>
        <button onclick="addToSlip('${row["Team A"]} +${row["Spread"]}')">${row["Team A"]} +${row["Spread"]}</button>
        <button onclick="addToSlip('${row["Team B"]} -${row["Spread"]}')">${row["Team B"]} -${row["Spread"]}</button>
        <button onclick="addToSlip('${row["Team A"]} ML')">${row["Team A"]} ML</button>
        <button onclick="addToSlip('${row["Team B"]} ML')">${row["Team B"]} ML</button>
        <button onclick="addToSlip('OVER ${row["Over Odds"]}')">OVER ${row["Over Odds"]}</button>
        <button onclick="addToSlip('UNDER ${row["Under Odds"]}')">UNDER ${row["Under Odds"]}</button>
      `;
      matchupsDiv.appendChild(container);
    });
  }
});

// === Fetch Bankroll ===
Papa.parse(BANKROLL_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const userRow = data.find(row => row.Name?.toLowerCase() === currentUser?.toLowerCase());
    const bankroll = userRow ? parseFloat(userRow.Bankroll || 0) : 0;
    document.getElementById("bankroll").textContent = bankroll.toFixed(2);
  }
});

// === Bet Slip Functions ===
function addToSlip(bet) {
  betSlip.push(bet);
  renderSlip();
}

function renderSlip() {
  const list = document.getElementById("slip-items");
  list.innerHTML = "";
  betSlip.forEach((bet, index) => {
    const item = document.createElement("li");
    item.innerHTML = `${bet} <button onclick="removeFromSlip(${index})">X</button>`;
    list.appendChild(item);
  });
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  renderSlip();
}

document.getElementById("wager-input").addEventListener("change", (e) => {
  wagerAmount = parseFloat(e.target.value);
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
