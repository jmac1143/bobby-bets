const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";

let betSlipData = [];
let wagerAmount = 50;

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

      // Determine favorite for spread
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
    <label for="wagerInput">Wager Amount: $</label>
    <input type="number" id="wagerInput" value="${wagerAmount}" min="1" onchange="updateWager(this.value)">
    <button onclick="resetSlip()">Reset Slip</button>
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
