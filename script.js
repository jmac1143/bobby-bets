const MATCHUP_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=1385414165&single=true&output=csv";
const BANKROLL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=399533112&single=true&output=csv";
const SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbxG9FNe2oKdqxfdcqBXFWGY8hF83ATkT-hKLiowaJ1yp4GHYy5z5cJf0t3XlSG8exS-/exec";

let currentUser = localStorage.getItem('bobbybets_user');
let betSlip = [];
let bankroll = 0;
let wagerAmount = 50;

// Display username
document.getElementById('user-name').textContent = currentUser || 'Unknown';

// Fetch matchups
Papa.parse(MATCHUP_CSV, {
  download: true,
  header: true,
  complete: function(results) {
    const data = results.data;
    renderMatchups(data);
  }
});

// Fetch bankroll
Papa.parse(BANKROLL_CSV, {
  download: true,
  header: true,
  complete: function(results) {
    const userRow = results.data.find(row => row.Bettor?.trim() === currentUser);
    if (userRow && userRow.Balance) {
      bankroll = parseFloat(userRow.Balance.replace('$', '').replace(',', '')) || 0;
    }
    document.getElementById('bankroll').textContent = `$${bankroll.toFixed(2)}`;
  }
});

// Render matchups
function renderMatchups(data) {
  const container = document.getElementById('matchups');
  container.innerHTML = '';

  data.forEach((row, index) => {
    if (!row['Team A'] || !row['Team B']) return;

    const spread = parseFloat(row['Spread']);
    const favoredTeam = parseFloat(row['Projected A']) > parseFloat(row['Projected B']) ? 'A' : 'B';
    const teamASpread = favoredTeam === 'A' ? `-${spread}` : `+${spread}`;
    const teamBSpread = favoredTeam === 'B' ? `-${spread}` : `+${spread}`;

    const matchHTML = `
      <div class="matchup">
        <div class="team">${row['Team A']}</div>
        <button onclick="addToBetSlip('${row['Team A']} Spread ${teamASpread}')">${teamASpread}</button>
        <button onclick="addToBetSlip('${row['Team A']} ML')">ML</button>

        <div class="vs">vs</div>

        <div class="team">${row['Team B']}</div>
        <button onclick="addToBetSlip('${row['Team B']} Spread ${teamBSpread}')">${teamBSpread}</button>
        <button onclick="addToBetSlip('${row['Team B']} ML')">ML</button>

        <div class="over-under">
          <button onclick="addToBetSlip('OVER ${row['Over/Under']}')">OVER ${row['Over/Under']}</button>
          <button onclick="addToBetSlip('UNDER ${row['Over/Under']}')">UNDER ${row['Over/Under']}</button>
        </div>
      </div>
    `;
    container.innerHTML += matchHTML;
  });
}

// Add to bet slip
function addToBetSlip(bet) {
  if (!betSlip.includes(bet)) {
    betSlip.push(bet);
    renderBetSlip();
  }
}

// Remove individual
function removeFromBetSlip(index) {
  betSlip.splice(index, 1);
  renderBetSlip();
}

// Reset entire slip
function resetBetSlip() {
  betSlip = [];
  renderBetSlip();
}

// Change wager
function updateWager(input) {
  wagerAmount = parseFloat(input.value) || 0;
}

// Render slip
function renderBetSlip() {
  const slip = document.getElementById('bet-slip');
  slip.innerHTML = betSlip.map((bet, i) => `
    <div>${bet} <button onclick="removeFromBetSlip(${i})">✖</button></div>
  `).join('');

  slip.innerHTML += `
    <div class="wager">
      <label>Wager: $</label>
      <input type="number" value="${wagerAmount}" onchange="updateWager(this)" />
    </div>
    <button onclick="submitBet()">Submit Bet</button>
    <button onclick="resetBetSlip()">Reset Slip</button>
  `;
}

// Submit bet
function submitBet() {
  if (wagerAmount > bankroll) {
    alert("Insufficient funds.");
    return;
  }

  fetch(SCRIPT_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      user: currentUser,
      bets: betSlip,
      wager: wagerAmount
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.text())
    .then(msg => {
      alert("Bet submitted!");
      resetBetSlip();
      bankroll -= wagerAmount;
      document.getElementById('bankroll').textContent = `$${bankroll.toFixed(2)}`;
    }).catch(err => {
      alert("Error submitting bet.");
      console.error(err);
    });
}
