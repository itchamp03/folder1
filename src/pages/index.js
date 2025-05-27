import { useState, useEffect } from 'react';

const players75 = [
  "Michael Jordan",
  "LeBron James",
  "Kareem Abdul-Jabbar",
  "Bill Russell",
  "Magic Johnson",
  "Larry Bird",
  "Wilt Chamberlain",
  "Tim Duncan",
  "Kobe Bryant",
  "Shaquille O'Neal",
  "Kevin Durant",
  "Stephen Curry",
  "Oscar Robertson",
  "Hakeem Olajuwon",
  "Jerry West",
  "Moses Malone",
  "Charles Barkley",
  "Karl Malone",
  "Dirk Nowitzki",
  "John Stockton",
  "Kevin Garnett",
  "Dwyane Wade",
  "Allen Iverson",
  "Scottie Pippen",
  "Isiah Thomas",
  "Steve Nash",
  "Patrick Ewing",
  "Ray Allen",
  "Jason Kidd",
  "Reggie Miller",
  "Chris Paul",
  "Giannis Antetokounmpo",
  "James Harden",
  "Anthony Davis",
  "Paul Pierce",
  "Carmelo Anthony",
  "Russell Westbrook",
  "Damian Lillard",
  "Kawhi Leonard",
  "Joel Embiid",
  "Nikola Jokic",
  "Bradley Beal",
  "Zion Williamson",
  "Julius Erving",
  "Bob Cousy",
  "Dennis Rodman",
  "George Gervin",
  "Walt Frazier",
  "Alonzo Mourning",
  "Dikembe Mutombo",
  "David Robinson",
  "Yao Ming",
  "Dwight Howard",
  "Tracy McGrady",
  "Paul George",
  "Klay Thompson",
  "Draymond Green",
  "DeMar DeRozan",
  "Kyle Lowry",
  "John Wall",
  "Rajon Rondo",
  "Chris Bosh",
  "Marc Gasol",
  "Blake Griffin",
  "Victor Oladipo",
  "Jamal Murray",
  "Ben Simmons",
  "De'Aaron Fox",
  "Donovan Mitchell",
  "Zach LaVine",
  "Jayson Tatum",
  "Jaylen Brown",
  "Fred VanVleet",
  "Mikal Bridges",
  "Shai Gilgeous-Alexander",
  "Dejounte Murray",
  "LaMelo Ball",
  "Tyrese Haliburton",
  "Anthony Edwards"
];

const STORAGE_KEY = 'nbaPlayerEloRankings';
const K = 30;

export default function Home() {
  // Load players from localStorage or initialize
  const loadPlayers = () => {
    if (typeof window === 'undefined') return players75.map(name => ({ name, elo: 1500 }));
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return players75.map(name => ({ name, elo: 1500 }));
      }
    } else {
      return players75.map(name => ({ name, elo: 1500 }));
    }
  };

  const [players, setPlayers] = useState(loadPlayers);
  const [currentPair, setCurrentPair] = useState([]);

  // Save players to localStorage
  const savePlayers = (playersToSave) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playersToSave));
  };

  // Elo calculations
  const expectedScore = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));
  const updateElo = (winner, loser) => {
    let expectedWinner = expectedScore(winner.elo, loser.elo);
    let expectedLoser = expectedScore(loser.elo, winner.elo);
    winner.elo = winner.elo + K * (1 - expectedWinner);
    loser.elo = loser.elo + K * (0 - expectedLoser);
  };

  // Pick two different players randomly
  const getRandomPair = () => {
    let i = Math.floor(Math.random() * players.length);
    let j;
    do {
      j = Math.floor(Math.random() * players.length);
    } while (j === i);
    return [players[i], players[j]];
  };

  // Update current pair for voting
  const showNewPair = () => {
    setCurrentPair(getRandomPair());
  };

  // On first load, show a pair
  useEffect(() => {
    showNewPair();
  }, []);

  // Handle button click for winner
  const vote = (winnerIndex) => {
    let updatedPlayers = [...players];
    const winner = currentPair[winnerIndex];
    const loser = currentPair[1 - winnerIndex];

    // Update ELO
    updateElo(winner, loser);

    // Replace updated players in array
    updatedPlayers = updatedPlayers.map(p =>
      p.name === winner.name ? winner : p.name === loser.name ? loser : p
    );

    // Save and update state
    savePlayers(updatedPlayers);
    setPlayers(updatedPlayers);

    // Show new pair
    showNewPair();
  };

  // Sort players by Elo descending
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif', textAlign: 'center', backgroundColor: '#f9f9f9', color: '#222' }}>
      <h2>Who is better?</h2>
      {currentPair.length === 2 && (
        <>
          <button onClick={() => vote(0)} style={buttonStyle}>{currentPair[0].name}</button>
          <span style={{ margin: '0 10px' }}>vs</span>
          <button onClick={() => vote(1)} style={buttonStyle}>{currentPair[1].name}</button>
        </>
      )}
      <h2>Rankings</h2>
      <table style={{ margin: '25px auto 0', borderCollapse: 'collapse', width: '100%', maxWidth: 600, backgroundColor: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
        <thead style={{ backgroundColor: '#007BFF', color: 'white' }}>
          <tr><th style={thTdStyle}>Rank</th><th style={thTdStyle}>Player</th><th style={thTdStyle}>Elo</th></tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, idx) => (
            <tr key={p.name} style={idx % 2 === 0 ? { backgroundColor: '#f9f9f9' } : {}}>
              <td style={thTdStyle}>{idx + 1}</td>
              <td style={thTdStyle}>{p.name}</td>
              <td style={thTdStyle}>{p.elo.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const buttonStyle = {
  fontSize: '1.2rem',
  padding: '12px 24px',
  margin: '10px 15px',
  cursor: 'pointer',
  border: '2px solid #007BFF',
  borderRadius: 6,
  backgroundColor: 'white',
  color: '#007BFF',
  transition: 'background-color 0.3s, color 0.3s',
  minWidth: 180
};

const thTdStyle = {
  padding: '10px 15px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left',
  fontSize: '1rem'
};
