
const bettor = localStorage.getItem("bettor") || "Guest";
document.getElementById("welcome").textContent = "Welcome, " + bettor;

Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?output=csv", {
  download: true,
  header: true,
  complete: function(results) {
    const matchups = results.data;
    const container = document.getElementById("matchups");
    matchups.forEach((row, i) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${row.Matchup}</h3>
        <button onclick="addToSlip('${row.TeamA} -${row.Spread}', '${row.Matchup}')">${row.TeamA} -${row.Spread}</button>
        <button onclick="addToSlip('${row.TeamB} +${row.Spread}', '${row.Matchup}')">${row.TeamB} +${row.Spread}</button>
        <button onclick="addToSlip('${row.TeamA} ML', '${row.Matchup}')">${row.TeamA} ML</button>
        <button onclick="addToSlip('${row.TeamB} ML', '${row.Matchup}')">${row.TeamB} ML</button>
        <button onclick="addToSlip('OVER ${row.OU}', '${row.Matchup}')">OVER ${row.OU}</button>
        <button onclick="addToSlip('UNDER ${row.OU}', '${row.Matchup}')">UNDER ${row.OU}</button>
      `;
      container.appendChild(div);
    });
  }
});

let slip = [];
function addToSlip(bet, matchup) {
  slip.push({ bet, matchup });
  renderSlip();
}
function renderSlip() {
  const el = document.getElementById("bet-slip");
  el.innerHTML = "<h4>Bet Slip</h4>";
  slip.forEach((s, i) => {
    el.innerHTML += `<div>${s.matchup}: ${s.bet} <button onclick="removeSlip(${i})">x</button></div>`;
  });
}
function removeSlip(i) {
  slip.splice(i, 1);
  renderSlip();
}
