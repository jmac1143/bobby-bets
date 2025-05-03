
let betSlip = [];
function addToBetSlip(bet) {
  if (betSlip.find(b => b.id === bet.id)) return;
  betSlip.push(bet); updateBetSlipUI();
}
function removeFromBetSlip(id) {
  betSlip = betSlip.filter(b => b.id !== id); updateBetSlipUI();
}
function clearBetSlip() { betSlip = []; updateBetSlipUI(); }
function updateBetSlipUI() {
  const slipContainer = document.getElementById("bet-slip");
  slipContainer.innerHTML = "";
  if (betSlip.length === 0) {
    slipContainer.innerHTML = "<p>No bets added.</p>"; return;
  }
  betSlip.forEach((bet) => {
    const betItem = document.createElement("div");
    betItem.className = "bet-item";
    betItem.innerHTML = `<span>${bet.label}</span>
      <button onclick="removeFromBetSlip('${bet.id}')">🗑️</button>`;
    slipContainer.appendChild(betItem);
  });
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Slip"; clearBtn.onclick = clearBetSlip;
  slipContainer.appendChild(clearBtn);
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit Bets";
  submitBtn.onclick = () => alert("Submission logic coming next!");
  slipContainer.appendChild(submitBtn);
}
window.onload = function () {
  const container = document.getElementById("matchups");
  for (let i = 1; i <= 3; i++) {
    const teamA = "Team A" + i, teamB = "Team B" + i;
    const card = document.createElement("div");
    card.innerHTML = `
      <h3>Game ${i}: ${teamA} vs ${teamB}</h3>
      <button onclick="addToBetSlip({id: 'g${i}-sa', label: '${teamA} -6.5'})">${teamA} -6.5</button>
      <button onclick="addToBetSlip({id: 'g${i}-sb', label: '${teamB} +6.5'})">${teamB} +6.5</button>
      <button onclick="addToBetSlip({id: 'g${i}-mla', label: '${teamA} ML'})">${teamA} ML</button>
      <button onclick="addToBetSlip({id: 'g${i}-mlb', label: '${teamB} ML'})">${teamB} ML</button>
      <button onclick="addToBetSlip({id: 'g${i}-over', label: 'OVER'})">OVER</button>
      <button onclick="addToBetSlip({id: 'g${i}-under', label: 'UNDER'})">UNDER</button>`;
    container.appendChild(card);
  }
};
