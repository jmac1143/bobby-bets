const matchupSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=858725653&single=true&output=csv";
const bankrollSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=1385414165&single=true&output=csv";
const scriptEndpoint = "https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXFWGY8hF83ATkT-hKLiowaJ1yp4GHYy5z5cJf0t3XlSG8exS-/exec";

let betSlip = [];
let user = localStorage.getItem("loggedInUser") || "Unknown";
let bankroll = 0;

// Display welcome message
document.getElementById("welcome").innerText = `Welcome, ${user}`;

// Fetch bankroll
Papa.parse(bankrollSheetURL, {
  download: true,
  header: true,
  complete: function (results) {
    const rows = results.data;
    const userRow = rows.find(r => r["Bettor"] && r["Bettor"].trim().toLowerCase() === user.toLowerCase());
    if (userRow && userRow["Bankroll"]) {
      const raw = userRow["Bankroll"].replace(/\$/g, "").replace(/,/g, "").trim();
      bankroll = parseFloat(raw);
      updateBetSlip();
    }
  }
});

// Fetch matchups
Papa.parse(matchupSheetURL, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const matchupsContainer = document.getElementById("matchups");
    matchupsContainer.innerHTML = "";

    data.forEach((row, index) => {
      const teamA = row["Team A"];
      const teamB = row["Team B"];
      const projA = parseFloat(row["Projected A"]);
      const projB = parseFloat(row["Projected B"]);
      const spread = parseFloat(row["Spread"]);
      const overUnder = parseFloat(row["Over/Under"]);

      if (!teamA || !teamB || isNaN(projA) || isNaN(projB) || isNaN(spread) || isNaN(overUnder)) return;

      const favored = projA > projB ? teamA : teamB;
      const spreadA = teamA === favored ? `-${spread}` : `+${spread}`;
      const spreadB = teamB === favored ? `-${spread}` : `+${spread}`;

      const gameDiv = document.createElement("div");
      gameDiv.classList.add("game");
      gameDiv.innerHTML = `
        <h3>Game ${index + 1}: ${teamA} vs ${teamB}</h3>
        <button onclick="addToSlip('${teamA}', 'Spread', '${spreadA}')">${teamA} ${spreadA}</button>
        <button onclick="addToSlip('${teamB}', 'Spread', '${spreadB}')">${teamB} ${spreadB}</button>
        <button onclick="addToSlip('${teamA}', 'ML', 'ML')">${teamA} ML</button>
        <button onclick="addToSlip('${teamB}', 'ML', 'ML')">${teamB} ML</button>
        <button onclick="addToSlip('OVER', 'O/U', '${overUnder}')">OVER ${overUnder}</button>
        <button onclick="addToSlip('UNDER', 'O/U', '${overUnder}')">UNDER ${overUnder}</button>
      `;
      matchupsContainer.appendChild(gameDiv);
    });
  }
});

function addToSlip(team, type, value) {
  betSlip.push({ team, type, value });
  updateBetSlip();
}

function updateBetSlip() {
  const slip = document.getElementById("betSlip");
  slip.innerHTML = "";

  const bankrollDiv = document.createElement("div");
  bankrollDiv.innerHTML = `<strong>Bankroll:</strong> $${bankroll.toFixed(2)}`;
  slip.appendChild(bankrollDiv);

  const wagerLabel = document.createElement("label");
  wagerLabel.innerHTML = `Wager: $<input type="number" id="wager" value="50" min="1" />`;
  slip.appendChild(wagerLabel);

  betSlip.forEach((bet, index) => {
    const div = document.createElement("div");
    div.innerHTML = `${bet.team} ${bet.type} ${bet.value} <button onclick="removeFromSlip(${index})">x</button>`;
    slip.appendChild(div);
  });

  const btnGroup = document.createElement("div");
  btnGroup.innerHTML = `
    <button onclick="submitSlip()">Submit Bet</button>
    <button onclick="resetSlip()">Reset Slip</button>
  `;
  slip.appendChild(btnGroup);
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  updateBetSlip();
}

function resetSlip() {
  betSlip.length = 0;
  updateBetSlip();
}

function submitSlip() {
  const wager = parseFloat(document.getElementById("wager").value);
  if (isNaN(wager) || wager <= 0) return alert("Invalid wager.");
  if (wager > bankroll) return alert("Insufficient bankroll.");

  const payload = {
    user,
    wager,
    bets: JSON.stringify(betSlip),
    timestamp: new Date().toISOString(),
  };

  fetch(scriptEndpoint, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(data => {
      alert("Bet submitted!");
      bankroll -= wager;
      resetSlip();
    })
    .catch(err => {
      console.error("Bet submission error:", err);
      alert("Error submitting bet.");
    });
}
