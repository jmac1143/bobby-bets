const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";
const bankrollUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=1071714179&single=true&output=csv";

let betSlipData = [];
let wagerAmount = 50;
let currentUser = localStorage.getItem("loggedInUser") || "Unknown";
let currentBankroll = 0;

Papa.parse(bankrollUrl, {
  download: true,
  header: true,
  complete: function(results) {
    const users = results.data;
   const user = users.find(u => u.Bettor === currentUser);

currentBankroll = user ? parseInt(user.Bankroll.replace(/[^0-9]/g, "")) : 0;
    renderSlip(); // Ensure bankroll shows
  }
});

Papa.parse(csvUrl, {
  download: true,
  header: true,
  complete: function(results) {
    const data = results.data;
    const container = document.getElementById("matchups");

    data.forEach((row, index) => {
      const teamA = row["Team A"];
      const teamB = row["Team B"];
      const spread = parseFloat(row["Spread"]);
      const moneylineA = parseInt(row["Moneyline A"]);
      const moneylineB = parseInt(row["Moneyline B"]);
      const overUnder = row["Over/Under Line"];

      let spreadA, spreadB;
      if (moneylineA < moneylineB) {
        spreadA = `-${spread}`;
        spreadB = `+${spread}`;
      } else {
        spreadA = `+${spread}`;
        spreadB = `-${spread}`;
      }

      const gameDiv = document.createElement("div");
      gameDiv.innerHTML = `
        <h3>Game ${index + 1}: ${teamA} vs ${teamB}</h3>
        <button onclick="addToSlip('${teamA}', '${spreadA}')">${teamA} ${spreadA}</button>
        <button onclick="addToSlip('${teamB}', '${spreadB}')">${teamB} ${spreadB}</button>
        <button onclick="addToSlip('${teamA}', 'ML')">${teamA} ML</button>
        <button onclick="addToSlip('${teamB}', 'ML')">${teamB} ML</button>
        <button onclick="addToSlip('OVER', '${overUnder}')">OVER ${overUnder}</button>
        <button onclick="addToSlip('UNDER', '${overUnder}')">UNDER ${overUnder}</button>
      `;
      container.appendChild(gameDiv);
    });
  }
});

function addToSlip(team, betType) {
  betSlipData.push({ team, betType });
  renderSlip();
}

function renderSlip() {
  const slip = document.getElementById("betSlip");
  slip.innerHTML = "<h4>Bet Slip</h4>";

  betSlipData.forEach((bet, index) => {
    const betDiv = document.createElement("div");
    betDiv.classList.add("bet-item");
    betDiv.innerHTML = `
      ${bet.team}: ${bet.betType}
      <button onclick="removeBet(${index})">❌</button>
    `;
    slip.appendChild(betDiv);
  });

  const wagerDiv = document.createElement("div");
  wagerDiv.innerHTML = `
    <p><strong>Bankroll:</strong> $${currentBankroll}</p>
    <label for="wagerInput">Wager Amount: $</label>
    <input type="number" id="wagerInput" value="${wagerAmount}" min="1" onchange="updateWager(this.value)">
    <button onclick="resetSlip()">Reset Slip</button>
    <button onclick="submitSlip()">Submit Bet</button>
  `;
  slip.appendChild(wagerDiv);
}

function removeBet(index) {
  betSlipData.splice(index, 1);
  renderSlip();
}

function resetSlip() {
  betSlipData = [];
  renderSlip();
}

function updateWager(value) {
  wagerAmount = parseInt(value) || 50;
}

function submitSlip() {
  if (wagerAmount > currentBankroll) {
    alert("You do not have enough bankroll to place this wager.");
    return;
  }

  const payload = {
    user: currentUser,
    wager: wagerAmount,
    picks: JSON.stringify(betSlipData)
  };

  fetch("https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXFWGY8hF83ATkT-hKLiowaJ1yp4GHYy5z5cJf0t3XlSG8exS-/exec", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.text())
    .then(data => {
      alert("Bet submitted successfully!");
      currentBankroll -= wagerAmount;
      resetSlip();
    })
    .catch(error => {
      alert("Error submitting bet.");
      console.error("Submission error:", error);
    });
}
