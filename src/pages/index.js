import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // adjust number of ../ based on folder depth


const K = 30;

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);

  // Fetch players from Supabase
  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*');
    if (error) {
      console.error('Error fetching players:', error);
    } else {
      setPlayers(data);
    }
  };

  // Elo calculations
  const expectedScore = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

  const updateElo = (winner, loser) => {
    const expectedWinner = expectedScore(winner.elo, loser.elo);
    const expectedLoser = expectedScore(loser.elo, winner.elo);

    const winnerNewElo = winner.elo + K * (1 - expectedWinner);
    const loserNewElo = loser.elo + K * (0 - expectedLoser);

    return {
      winnerNewElo: Math.round(winnerNewElo),
      loserNewElo: Math.round(loserNewElo),
    };
  };

  // Pick two different players randomly
  const getRandomPair = () => {
    if (players.length < 2) return [];
    let i = Math.floor(Math.random() * players.length);
    let j;
    do {
      j = Math.floor(Math.random() * players.length);
    } while (j === i);
    return [players[i], players[j]];
  };

  // Show a new pair
  const showNewPair = () => {
    setCurrentPair(getRandomPair());
  };

  // On load fetch players and show a pair
  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (players.length >= 2) {
      showNewPair();
    }
  }, [players]);

  // Handle voting and update Elo in Supabase
  const vote = async (winnerIndex) => {
    const winner = currentPair[winnerIndex];
    const loser = currentPair[1 - winnerIndex];

    const { winnerNewElo, loserNewElo } = updateElo(winner, loser);

    // Update DB
    const { error: errorWinner } = await supabase
      .from('players')
      .update({ elo: winnerNewElo })
      .eq('id', winner.id);

    const { error: errorLoser } = await supabase
      .from('players')
      .update({ elo: loserNewElo })
      .eq('id', loser.id);

    if (errorWinner || errorLoser) {
      console.error('Error updating Elo:', errorWinner, errorLoser);
      return;
    }

    // Update local state immediately for UI responsiveness
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === winner.id) return { ...p, elo: winnerNewElo };
        if (p.id === loser.id) return { ...p, elo: loserNewElo };
        return p;
      })
    );

    showNewPair();
  };

  // Sort by Elo descending
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'Arial, sans-serif', textAlign: 'center', backgroundColor: '#f9f9f9', color: '#222' }}>
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
            <tr key={p.id} style={idx % 2 === 0 ? { backgroundColor: '#f9f9f9' } : {}}>
              <td style={thTdStyle}>{idx + 1}</td>
              <td style={thTdStyle}>{p.name}</td>
              <td style={thTdStyle}>{p.elo}</td>
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
  minWidth: 180,
};

const thTdStyle = {
  padding: '10px 15px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left',
  fontSize: '1rem',
};
