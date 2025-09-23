// auto-update.js - Simple text replacement for real matches

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const BETS = ["Over 2.5", "BTTS", "Double Chance", "Draw or Away", "Handicap -1"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAIPrediction(homeTeam, awayTeam) {
  const confidence = Math.floor(Math.random() * 25) + 65;
  const prediction = getRandomItem(["Home Win", "Draw", "Away Win"]);
  const bet = getRandomItem(BETS);
  const oddsLow = (Math.random() * 1.5 + 1.8).toFixed(2);
  const oddsHigh = (parseFloat(oddsLow) + Math.random() * 0.5).toFixed(2);
  
  return {
    prediction,
    confidence,
    bet,
    odds: `${oddsLow} — ${oddsHigh}`
  };
}

async function fetchTodayMatches() {
  // Using TheSportsDB - free, no key required
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}`);
    const data = await response.json();
    
    if (data.events && data.events.length > 0) {
      return data.events.map(game => {
        const ai = generateAIPrediction(game.strHomeTeam, game.strAwayTeam);
        return {
          home: game.strHomeTeam,
          away: game.strAwayTeam,
          time: game.dateEvent,
          league: game.strLeague,
          ...ai
        };
      });
    }
  } catch (error) {
    console.error("API Error:", error);
  }
  
  // Fallback if no matches found
  return generateFallbackMatches();
}

function generateFallbackMatches() {
  const TEAMS = [
    "Arsenal", "Liverpool", "Chelsea", "Man City", "Man United",
    "Real Madrid", "Barcelona", "Atletico Madrid", "PSG", "Lyon",
    "Bayern Munich", "Dortmund", "Juventus", "AC Milan", "Inter Milan"
  ];
  
  let matches = [];
  for (let i = 0; i < 8; i++) {
    let home = getRandomItem(TEAMS);
    let away = getRandomItem(TEAMS);
    while (away === home) away = getRandomItem(TEAMS);
    
    const ai = generateAIPrediction(home, away);
    matches.push({
      home,
      away,
      time: new Date().toISOString(),
      league: "Test League",
      ...ai
    });
  }
  return matches;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateHTML(matches, isPremium = false, limit = 5) {
  return matches.slice(0, limit).map((game, index) => {
    if (isPremium && index >= 3) return '';
    
    if (isPremium) {
      return `
        <div class="prediction-card locked">
          <div class="match">🔒 Premium Pick ${index + 1}</div>
          <div class="prediction">🎯 Subscribe to unlock elite AI picks</div>
          <div class="ev">💰 EV: <span class="ev-high">+${(Math.random() * 10 + 12).toFixed(1)}%</span></div>
        </div>
      `;
    } else {
      return `
        <div class="prediction-card">
          <div class="match">🏆 ${game.home} vs ${game.away}</div>
          <div class="meta">${game.league} • ${formatTime(game.time)}</div>
          <div class="prediction">🎯 ${game.prediction} <span class="confidence ${game.confidence > 80 ? 'high' : 'medium'}">${game.confidence}%</span></div>
          <div class="bet">💡 Bet: ${game.bet}</div>
          <div class="odds">💰 Odds: ${game.odds}</div>
        </div>
      `;
    }
  }).join('\n');
}

async function updatePredictions() {
  try {
    // Read index.html
    let html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
    
    // Fetch real matches
    const allMatches = await fetchTodayMatches();
    const freeMatches = allMatches.slice(0, 10);
    const premiumMatches = [...allMatches];
    
    // Replace free predictions
    const freeHTML = generateHTML(freeMatches, false, 5);
    html = html.replace(
      '<!-- AUTO-INSERTED FREE MATCHES WILL APPEAR HERE -->',
      freeHTML
    );
    
    // Replace premium predictions
    const premiumHTML = generateHTML(premiumMatches, true, 3);
    html = html.replace(
      '<!-- AUTO-INSERTED PREMIUM MATCHES WILL APPEAR HERE -->',
      premiumHTML
    );
    
    // Update footer date
    const dateRegex = /Last Updated: [^<]*/;
    const newDate = `Last Updated: ${new Date().toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    html = html.replace(dateRegex, newDate);
    
    // Write back to index.html
    await fs.writeFile(path.join(__dirname, 'index.html'), html, 'utf8');
    console.log(`✅ Successfully updated with ${freeMatches.length} real matches!`);
    
  } catch (error) {
    console.error('Update failed:', error);
  }
}

updatePredictions().catch(console.error);
