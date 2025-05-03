const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";
const bankrollURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=1385414165&single=true&output=csv";

const betSlip = [];
let user = localStorage.getItem("loggedInUser") || "Unknown";
let bankroll = 0;

// Fetch bankroll
fetch(bankrollURL)
  .then(r => r.text())
  .then(text => {
    const rows = text.trim().split("\n").map(row => row.split(","));
    const headers = rows.shift();
    const userIndex = rows.findIndex(r => r[0].trim().toLowerCase() === user.toLowerCase());
    if (userIndex !== -1) {
      const raw = rows[userIndex][1].replace(/\$/g, "").trim();
      bankroll = parseFloat(raw);
      document.getElementById("welcome").innerText = `Welcome, ${user}`;
      updateBetSlip();
    }
  });

// Fetch matchups
fetch(sheetURL)
  .then(r => r.text())
  .then(text => {
    const rows = text.trim().split("\n").slice(1).map(row => row.split(","));
    const container = document.getElementById("matchups");
    rows.forEach((row, i) => {
      const [teamA, teamB, projA, projB, , , , , , , spread, ou] = row;
      const numProjA = parseFloat(projA);
      const numProjB = parseFloat(projB);
      const spreadVal = parseFloat(spread);

      const favored = numProjA > numProjB ? teamA : teamB;
      const dog = favored === teamA ? teamB : teamA;
      const spreadA = favored === teamA ? `-${spreadVal}` : `+${spreadVal}`;
      const spreadB = favored === teamB ? `-${spreadVal}` : `+${spreadVal}`;

      const div = document.createElement("div");
      div.classList.add("game");

      div.innerHTML = `
        <h3>Game ${i + 1}: ${teamA} vs ${teamB}</h3>
        <button onclick="addToSlip('${teamA}', 'Spread', '${spreadA}')">${teamA} ${spreadA}</button>
        <button onclick="addToSlip('${teamB}', 'Spread', '${spreadB}')">${teamB} ${spreadB}</button>
        <button onclick="addToSlip('${teamA}', 'ML', 'ML')">${teamA} ML</button>
        <button onclick="addToSlip('${teamB}', 'ML', 'ML')">${teamB} ML</button>
        <button onclick="addToSlip('OVER', 'O/U', '${ou}')">OVER ${ou}</button>
        <button onclick="addToSlip('UNDER', 'O/U', '${ou}')">UNDER ${ou}</button>
      `;

      container.appendChild(div);
    });
  });

function addToSlip(team, type, value) {
  betSlip.push({ team, type, value });
  updateBetSlip();
}

function updateBetSlip() {
  const slip = document.getElementById("bet-slip");
  slip.innerHTML = `
    <div>
      <p><strong>Bankroll:</strong> $${bankroll.toFixed(2)}</p>
      <label>Wager: $<input type="number" id="wager" value="50" min="1" /></label>
      <button onclick="resetSlip()">Reset Slip</button>
      <button onclick="submitSlip()">Submit Bet</button>
    </div>
  `;
  betSlip.forEach((bet, index) => {
    const div = document.createElement("div");
    div.innerHTML = `${bet.team}: ${bet.type} ${bet.value} <button onclick="removeFromSlip(${index})">x</button>`;
    slip.appendChild(div);
  });
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
  if (isNaN(wager) || wager <= 0) {
    alert("Invalid wager amount.");
    return;
  }
  if (wager > bankroll) {
    alert("Insufficient bankroll.");
    return;
  }

  const payload = {
    user,
    wager,
    bets: JSON.stringify(betSlip),
    timestamp: new Date().toISOString(),
  };

  fetch("https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXFWGY8hF83ATkT-hKLiowaJ1yp4GHYy5z5cJf0t3XlSG8exS-/exec", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(data => {
      alert("Bet submitted successfully!");
      bankroll -= wager;
      resetSlip();
    })
    .catch(err => {
      console.error("Error submitting bet:", err);
      alert("Error submitting bet.");
    });
}
