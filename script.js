const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKKrO3Ieu6I1GIKiPnqcPlS5G8hopZzxgYqD9TS-W7Avn8I96WIt6VOwXJcwdRKfJz2iZnPS_6Tiw/pub?gid=0&single=true&output=csv";

Papa.parse(csvUrl, {
  download: true,
  header: true,
  complete: function(results) {
    const data = results.data;
    const container = document.getElementById("matchups");

    data.forEach((row, index) => {
      const teamA = row["Team A"];
      const teamB = row["Team B"];
      const spreadA = row["Spread A"];
      const spreadB = row["Spread B"];
      const moneylineA = row["Moneyline A"];
      const moneylineB = row["Moneyline B"];
      const overUnder = row["Over/Under Line"];
      const overOdds = row["Over Odds"];
      const underOdds = row["Under Odds"];

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
  const slip = document.getElementById("betSlip");
  const betDiv = document.createElement("div");
  betDiv.textContent = `${team}: ${betType}`;
  slip.appendChild(betDiv);
}

