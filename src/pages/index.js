import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const K = 30;

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Elo rating calculation helpers
  const expectedScore = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

  const updateElo = (winner, loser) => {
    const expectedWinner = expectedScore(winner.elo, loser.elo);
    const expectedLoser = expectedScore(loser.elo, winner.elo);

    // New ELO calculations, rounded to integer
    winner.elo = Math.round(winner.elo + K * (1 - expectedWinner));
    loser.elo = Math.round(loser.elo + K * (0 - expectedLoser));
  };

  // Fetch all players from Supabase database
  async function fetchPlayers() {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*');

      if (error) throw error;
      if (!data || data.length === 0) {
        setErrorMsg('No players found in database.');
        setPlayers([]);
        setCurrentPair([]);
      } else {
        setPlayers(data);
        setCurrentPair(getRandomPair(data));
      }
    } catch (error) {
      setErrorMsg(`Failed to fetch players: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Utility: pick two different random players from an array
  function getRandomPair(playerList) {
    if (playerList.length < 2) return [];
    let i = Math.floor(Math.random() * playerList.length);
    let j;
    do {
      j = Math.floor(Math.random() * playerList.length);
    } while (j === i);
    return [playerList[i], playerList[j]];
  }

  // Handle user vote for the winner (0 or 1 index)
  async function vote(winnerIndex) {
    if (currentPair.length !== 2) return;

    const winner = { ...currentPair[winnerIndex] };
    const loser = { ...currentPair[1 - winnerIndex] };

    // Update ELO ratings locally
    updateElo(winner, loser);

    // Update local players state
    const updatedPlayers = players.map(p => {
      if (p.id === winner.id) return winner;
      if (p.id === loser.id) return loser;
      return p;
    });

    // Save updated ELO ratings to Supabase
    try {
      const { error } = await supabase
        .from('players')
        .upsert([winner, loser], { onConflict: 'id' });

      if (error) throw error;

      setPlayers(updatedPlayers);
      setCurrentPair(getRandomPair(updatedPlayers));
    } catch (error) {
      setErrorMsg(`Failed to update player ratings: ${error.message}`);
    }
  }

  // Fetch players on component mount
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Sorted players by Elo descending
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <main
      style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: '0 20px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
        color: '#222',
        minHeight: '100vh',
      }}
    >
      <h1>NBA Player Elo Ranking</h1>

      {loading && <p>Loading players...</p>}
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {!loading && !errorMsg && currentPair.length === 2 && (
        <>
          <h2>Who is better?</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 30 }}>
            <button
              onClick={() => vote(0)}
              style={buttonStyle}
              aria-label={`Vote for ${currentPair[0].name}`}
            >
              {currentPair[0].name}
              <br />
              <small>Elo: {currentPair[0].elo}</small>
            </button>
            <span style={{ alignSelf: 'center', fontSize: '1.5rem' }}>vs</span>
            <button
              onClick={() => vote(1)}
              style={buttonStyle}
              aria-label={`Vote for ${currentPair[1].name}`}
            >
              {currentPair[1].name}
              <br />
              <small>Elo: {currentPair[1].elo}</small>
            </button>
          </div>
        </>
      )}

      {!loading && !errorMsg && (
        <>
          <h2>Player Rankings</h2>
          <table
            style={{
              margin: '25px auto 0',
              borderCollapse: 'collapse',
              width: '100%',
              maxWidth: 600,
              backgroundColor: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <thead style={{ backgroundColor: '#007BFF', color: 'white' }}>
              <tr>
                <th style={thTdStyle}>Rank</th>
                <th style={thTdStyle}>Player</th>
                <th style={thTdStyle}>Elo</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, idx) => (
                <tr
                  key={player.id}
                  style={idx % 2 === 0 ? { backgroundColor: '#f9f9f9' } : {}}
                >
                  <td style={thTdStyle}>{idx + 1}</td>
                  <td style={thTdStyle}>{player.name}</td>
                  <td style={thTdStyle}>{player.elo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

const buttonStyle = {
  fontSize: '1.2rem',
  padding: '12px 24px',
  cursor: 'pointer',
  border: '2px solid #007BFF',
  borderRadius: 6,
  backgroundColor: 'white',
  color: '#007BFF',
  minWidth: 180,
  transition: 'background-color 0.3s, color 0.3s',
};

const thTdStyle = {
  padding: '10px 15px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left',
  fontSize: '1rem',
};
