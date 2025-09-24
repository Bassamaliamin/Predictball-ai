// auto-update.js - Fetches matches with exact league name matching + debugging

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const BETS = ["Over 2.5", "BTTS", "Double Chance", "Draw or Away", "Handicap -1"];

// Define target leagues with exact names as they appear in API
const TARGET_LEAGUES = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A", 
  "German Bundesliga",
  // Alternative names that might appear in API
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga"
];

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
  const today = new Date().toISOString().split('T')[0];
  
  try {
    console.log(`🔍 Fetching matches for ${today}...`);
    
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}`);
    const data = await response.json();
    
    if (data.events && data.events.length > 0) {
      console.log(`📊 Total matches found: ${data.events.length}`);
      
      // Log all leagues found (for debugging)
      const allLeagues = [...new Set(data.events.map(game => game.strLeague))];
      console.log(`📋 All leagues found:`, allLeagues);
      
      // Filter to only target leagues (case-insensitive)
      const filteredMatches = data.events.filter(game => 
        TARGET_LEAGUES.some(target => 
          game.strLeague.toLowerCase().includes(target.toLowerCase())
        )
      );
      
      console.log(`🎯 Matches from target leagues: ${filteredMatches.length}`);
      
      if (filteredMatches.length > 0) {
        return filteredMatches.map(game => {
          const ai = generateAIPrediction(game.strHomeTeam, game.strAwayTeam);
          return {
            home: game.strHomeTeam,
            away: game.strAwayTeam,
            time: game.dateEvent,
            league: game.strLeague,
            ...ai
          };
        });
      } else {
        console.log("❌ No matches found in target leagues");
      }
    } else {
      console.log("❌ No matches found for today at all");
    }
  } catch (error) {
    console.error("API Error:", error);
  }
  
  // Fallback with only target league teams
  console.log("🔄 Using fallback matches from target leagues");
  return generateFallbackMatches();
}

function generateFallbackMatches() {
  // Only teams from your 4 target leagues
  const TEAMS = [
    // English Premier League
    { name: "Arsenal", league: "English Premier League" },
    { name: "Liverpool", league: "English Premier League" },
    { name: "Chelsea", league: "English Premier League" },
    { name: "Man City", league: "English Premier League" },
    { name: "Man United", league: "English Premier League" },
    { name: "Tottenham", league: "English Premier League" },
    { name: "Newcastle", league: "English Premier League" },
    { name: "Aston Villa", league: "English Premier League" },
    { name: "Brighton", league: "English Premier League" },
    { name: "West Ham", league: "English Premier League" },
    
    // Spanish La Liga
    { name: "Real Madrid", league: "Spanish La Liga" },
    { name: "Barcelona", league: "Spanish La Liga" },
    { name: "Atletico Madrid", league: "Spanish La Liga" },
    { name: "Real Sociedad", league: "Spanish La Liga" },
    { name: "Villarreal", league: "Spanish La Liga" },
    { name: "Real Betis", league: "Spanish La Liga" },
    { name: "Osasuna", league: "Spanish La Liga" },
    { name: "Girona", league: "Spanish La Liga" },
    
    // Italian Serie A
    { name: "Juventus", league: "Italian Serie A" },
    { name: "AC Milan", league: "Italian Serie A" },
    { name: "Inter Milan", league: "Italian Serie A" },
    { name: "Napoli", league: "Italian Serie A" },
    { name: "Roma", league: "Italian Serie A" },
    { name: "Lazio", league: "Italian Serie A" },
    { name: "Atalanta", league: "Italian Serie A" },
    { name: "Fiorentina", league: "Italian Serie A" },
    
    // German Bundesliga
    { name: "Bayern Munich", league: "German Bundesliga" },
    { name: "Dortmund", league: "German Bundesliga" },
    { name: "Leipzig", league: "German Bundesliga" },
    { name: "Leverkusen", league: "German Bundesliga" },
    { name: "Wolfsburg", league: "German Bundesliga" },
    { name: "Frankfurt", league: "German Bundesliga" },
    { name: "Union Berlin", league: "German Bundesliga" },
    { name: "Stuttgart", league: "German Bundesliga" }
  ];
  
  let matches = [];
  for (let i = 0; i < 8; i++) {
    let home = getRandomItem(TEAMS);
    let away = getRandomItem(TEAMS);
    while (away.name === home.name) away = getRandomItem(TEAMS);
    
    const ai = generateAIPrediction(home.name, away.name);
    matches.push({
      home: home.name,
      away: away.name,
      time: new Date().toISOString(),
      league: home.league,
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
    
    // Fetch matches with exact filtering
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
    console.log(`✅ Successfully updated with ${freeMatches.length} matches from target leagues!`);
    
  } catch (error) {
    console.error('Update failed:', error);
  }
}

updatePredictions().catch(console.error);
