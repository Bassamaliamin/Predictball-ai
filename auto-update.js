// auto-update.js - Runs daily to generate new predictions

const fs = require('fs').promises;
const path = require('path');

// Mock teams and predictions (later: connect to real AI)
const TEAMS = [
  "Liverpool", "Arsenal", "Man City", "Real Madrid", "Barcelona",
  "Bayern Munich", "PSG", "Juventus", "AC Milan", "Inter",
  "Chelsea", "Tottenham", "Atletico Madrid", "Dortmund", "Napoli"
];

const BETS = ["Over 2.5", "BTTS", "Double Chance", "Draw or Away", "Handicap -1"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrediction(index, isPremium = false) {
  const teamA = getRandomItem(TEAMS);
  let teamB = getRandomItem(TEAMS);
  while (teamB === teamA) teamB = getRandomItem(TEAMS);

  const confidence = isPremium ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 30) + 65;
  const outcome = Math.random() > 0.7 ? "❌ WRONG" : "✅ CORRECT";

  return {
    id: index + 1,
    match: `${teamA} vs ${teamB}`,
    prediction: `${getRandomItem(["Home Win", "Draw", "Away Win"])} (${confidence}%) → ${outcome}`,
    bet: getRandomItem(BETS),
    ev: isPremium ? `+${(Math.random() * 10 + 12).toFixed(1)}%` : null
  };
}

function generateHTML(predictions, isPremium = false) {
  return predictions.map(p => `
    <div class="prediction${isPremium ? ' locked' : ''}">
      <h3>${isPremium ? '🔒 Premium Pick ' + p.id : p.id + '. ' + p.match}</h3>
      <p>🎯 Prediction: ${p.prediction}</p>
      <p>💡 Recommended Bet: ${p.bet}</p>
      ${p.ev ? `<p>💰 EV Score: ${p.ev}</p>` : ''}
    </div>
  `).join('\n');
}

async function updatePredictions() {
  const today = new Date().toISOString().split('T')[0]; // e.g. "2025-04-06"
  
  // Generate 5 free predictions
  const freePredictions = Array.from({ length: 5 }, (_, i) => generatePrediction(i));
  const freeHTML = generateHTML(freePredictions);

  // Generate 3 premium predictions
  const premiumPredictions = Array.from({ length: 3 }, (_, i) => generatePrediction(i, true));
  const premiumHTML = generateHTML(premiumPredictions, true);

  // Read current index.html
  let html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');

  // Replace Free Predictions section
  const freeStart = '<div id="free" class="tab-content active">';
  const freeEnd = '</div> <!-- Free Predictions -->';
  const freeRegex = new RegExp(`${freeStart}[\\s\\S]*?${freeEnd}`);
  const newFreeSection = `${freeStart}
    <p class="subheader">Yesterday’s Record: ✅ 4 Wins | ❌ 1 Loss</p>

    ${freeHTML}
  ${freeEnd}`;
  html = html.replace(freeRegex, newFreeSection);

  // Replace Premium Predictions section
  const premiumStart = '<div id="premium" class="tab-content">';
  const premiumEnd = '</div> <!-- Premium Predictions -->';
  const premiumRegex = new RegExp(`${premiumStart}[\\s\\S]*?${premiumEnd}`);
  const newPremiumSection = `${premiumStart}
    <p class="subheader">Yesterday’s Premium Record: ✅ 3 Wins | ❌ 0 Loss</p>

    ${premiumHTML}

    <div class="pricing">
      <button class="mpesa-btn" onclick="showMpesa('weekly')">📲 Pay Weekly: Ksh.150 via M-Pesa</button>
      <button class="mpesa-btn monthly" onclick="showMpesa('monthly')">📲 Pay Monthly: Ksh.500 via M-Pesa</button>
    </div>

    <div id="mpesa-instructions" class="mpesa-instructions hidden">
      <h3>📲 How to Pay</h3>
      <p>1. Open M-Pesa on your phone</p>
      <p>2. Go to <strong>Lipa Na M-Pesa → Paybill</strong></p>
      <p>3. Enter Business Number: <strong>123456</strong></p>
      <p>4. Enter Account Number: <strong>YOUR_PHONE</strong></p>
      <p>5. Enter Amount: <span id="amount">Ksh.150</span></p>
      <p>6. Enter M-Pesa PIN</p>
      <p>✅ You’ll get SMS confirmation. Access granted within 5 mins!</p>
      <button class="close-btn" onclick="hideMpesa()">✕ Close</button>
    </div>
  ${premiumEnd}`;
  html = html.replace(premiumRegex, newPremiumSection);

  // Update footer date
  const dateRegex = /Updated: [A-Za-z]+ \d{1,2}, \d{4}/;
  const newDate = `Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  html = html.replace(dateRegex, newDate);

  // Write back to index.html
  await fs.writeFile(path.join(__dirname, 'index.html'), html, 'utf8');
  console.log(`✅ Predictions updated for ${today}`);
}

updatePredictions().catch(console.error);
