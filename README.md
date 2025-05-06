# 🏈 Bobby Bets Fantasy Sportsbook

Welcome to **Bobby Bets**, a custom-built fantasy football sportsbook interface for the Bobby Shawn’s Undercover Crooners league.

---

## 📂 Project Structure
/avatars → League manager avatars (for future expansion)
index.html → Login screen (user selection + PIN prompt)
bet.html → Main betting interface (matchups, bet slip, submission)
script.js → Core frontend logic (loads matchups, handles slips, submits bets)
style.css → Visual styles for the site
pins.json → (Deprecated) — was a placeholder, not used
README.md → You're reading it!

---

## 🔐 Login Details

- Users log in via `index.html` using a hardcoded PIN system.
- PINs are stored in `index.html` only.
- Upon successful login, the username is saved to `localStorage` under the key: `bobbybets_user`.

---

## 📈 Betting Workflow

1. User logs in and is redirected to `bet.html`.
2. Matchups for the current NFL week are dynamically loaded via PapaParse from a public Google Sheet.
3. Users can:
   - Select spread, moneyline, or over/under bets
   - Add multiple legs to build a parlay
   - Enter a wager amount
4. Bets are submitted to a Google Apps Script backend which:
   - Logs the bet with a unique Parlay ID
   - Deducts the wager from the user's bankroll
   - Prepares the sheet for manual result grading (WIN/PUSH/LOSS)

---

## 🧠 Backend Logic (Google Apps Script)

- `doPost`: Accepts and logs bets, deducts bankroll, assigns Parlay ID.
- `processBets`: Admin tool to process graded bets and payout winnings.
- Backend reads from and writes to:
  - `Bets` tab: Full bet history
  - `Bankrolls` tab: User balances

---

## 🔧 Sheets Used

- **Matchup Sheet** (Week-based tabs, updated via GID map in `script.js`)
- **Bankrolls Tab** (`Bankrolls`): User bankrolls in `$` format
- **Bets Tab** (`Bets`): All bets with columns for type, result, payout, etc.

---

## ⚠️ Admin Tools

- The `Bobby Bets` menu will appear inside the Google Sheet when opened.
- Use the `🤑 Process Results` option after grading bets to apply payouts.

---

## 🚧 Planned Enhancements (Optional Ideas)

- Leaderboard display
- Avatar-based login screen
- Weekly stats + reports
- UI styled to resemble a real sportsbook

---

## 👨‍🔧 Created By

- Justin McCartney (aka Commish Crooner)  
- Built for the *BSUC Fantasy Football League*  
- Designed to enhance the competitive chaos

---

For any feature ideas or support, reach out via GitHub or league chat.
