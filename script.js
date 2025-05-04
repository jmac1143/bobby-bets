const MATCHUP_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbyxG9FNe2oKdqxfdcqBXfWGy8hF83ATkT-hKLiowa3Iyp4GHY5z5CJf0t3XISG8exS/exec";

let currentUser = localStorage.getItem("bobbybets_user");
let betSlip = [];
let wagerAmount = 50;

document.getElementById("user-name").textContent = currentUser || "Unknown";

function calculatePayout(wager, odds) {
  if (odds > 0) return +(wager + (wager * odds / 100)).toFixed(2);
  return +(wager + (wager * 100 / Math.abs(odds))).toFixed(2);
}

Papa.parse(MATCHUP_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const matchupsDiv = document.getElementById("matchups");

    data.forEach((row, i) => {
      if (!row["Team A"] || !row["Team B"]) return;

      const teamA = row["Team A"];
      const teamB = row["Team B"];
      const spread = parseFloat(row["Spread"]);
      const mlA = parseInt(row["Moneyline A"]);
      const mlB = parseInt(row["Moneyline B"]);
      const spreadOddsA = row["Spread Odds A"];
      const spreadOddsB = row["Spread Odds B"];

      // Determine favorite and assign spread signs
      let favTeam, favML, favOdds, favSpread;
      let dogTeam, dogML, dogOdds, dogSpread;

      if (mlA < mlB) {
        favTeam = teamA;
        favML = mlA;
        favOdds = spreadOddsA;
        favSpread = `-${spread}`;
        dogTeam = teamB;
        dogML = mlB;
        dogOdds = spreadOddsB;
        dogSpread = `+${spread}`;
      } else {
        favTeam = teamB;
        favML = mlB;
        favOdds = spreadOddsB;
        favSpread = `-${spread}`;
        dogTeam = teamA;
        dogML = mlA;
        dogOdds = spreadOddsA;
        dogSpread = `+${spread}`;
      }

      const container = document.createElement("div");

      const makeButton = (label, odds, type) => {
        return `<button onclick='addToSlip(${JSON.stringify({ label, odds: Number(odds), type })})'>
          ${label} (${odds > 0 ? "+" + odds : odds})
        </button>`;
      };

      container.innerHTML = `
        <h3>Game ${i + 1}: ${teamA} vs ${teamB}</h3>

        ${makeButton(`${dogTeam} ${dogSpread}`, dogOdds, "spread")}
        ${makeButton(`${favTeam} ${favSpread}`, favOdds, "spread")}

        ${makeButton(`${teamA} ML`, mlA, "ml")}
        ${makeButton(`${teamB} ML`, mlB, "ml")}

        ${makeButton(`OVER`, Number(row["Over Odds"]) || -110, "over")}
        ${makeButton(`UNDER`, Number(row["Under Odds"]) || -110, "under")}
      `;
      matchupsDiv.appendChild(container);
    });
  }
});

Papa.parse(BANKROLL_CSV, {
  download: true,
  header: true,
  complete: function (results) {
    const data = results.data;
    const userRow = data.find(row => row.Bettor?.trim().toLowerCase() === currentUser?.trim().toLowerCase());
    const bankroll = userRow ? parseFloat(userRow.Bankroll.replace(/[\$,]/g, '')) || 0 : 0;
    document.getElementById("bankroll").textContent = bankroll.toFixed(2);
  }
});

function addToSlip(betObj) {
  betSlip.push(betObj);
  renderSlip();
}

function removeFromSlip(index) {
  betSlip.splice(index, 1);
  renderSlip();
}

function renderSlip() {
  const list = document.getElementById("slip-items");
  list.innerHTML = "";

  let totalPayout = 0;

  betSlip.forEach((bet, index) => {
    const payout = calculatePayout(wagerAmount, bet.odds);
    totalPayout += payout;

    const item = document.createElement("li");
    item.innerHTML = `
      ${bet.label} @ ${bet.odds > 0 ? "+" + bet.odds : bet.odds}
      <span style="margin-left: 10px; color: #aaa;">(Pays $${payout.toFixed(2)})</span>
      <button onclick="removeFromSlip(${index})">X</button>
    `;
    list.appendChild(item);
  });

  const payoutLine = document.getElementById("payout-line");
  payoutLine.textContent = `Total Wager: $${(wagerAmount * betSlip.length).toFixed(2)} | Potential Return: $${totalPayout.toFixed(2)}`;
}

document.getElementById("wager-input").addEventListener("change", (e) => {
  wagerAmount = parseFloat(e.target.value);
  renderSlip();
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
