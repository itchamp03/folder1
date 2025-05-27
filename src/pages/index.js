import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // adjust path as needed

const K = 30;

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch players from Supabase
  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase.from('players').select('*');
      if (error) throw error;
      setPlayers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error.message);
      setLoading(false);
    }
  };

  // Elo calculations
  const expectedScore = (ra, rb) => 1 / (1 + 10 ** ((rb - ra) / 400));

  const updateElo = (winner, loser) => {
    const expectedWinner = expectedScore(winner.elo, loser.elo);
    const expectedLoser = expectedScore(loser.elo, winner.elo);

    return {
      winnerNewElo: Math.round(winner.elo + K * (1 - expectedWinner)),
      loserNewElo: Math.round(loser.elo + K * (0 - expectedLoser)),
    };
  };

  // Pick two different random players
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
  const showNewPair = () => setCurrentPair(getRandomPair());

  // Initial fetch
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Show new pair once players loaded
  useEffect(() => {
    if (players.length >= 2) {
      showNewPair();
    }
  }, [players]);

  // Handle voting and update Elo
  const vote = async (winnerIndex) => {
    if (updating) return; // prevent double clicks

    setUpdating(true);

    const winner = currentPair[winnerIndex];
    const loser = currentPair[1 - winnerIndex];
    const { winnerNewElo, loserNewElo } = updateElo(winner, loser);

    try {
      const { error: errorWinner } = await supabase
        .from('players')
        .update({ elo: winnerNewElo })
        .eq('id', winner.id);
      const { error: errorLoser } = await supabase
        .from('players')
        .update({ elo: loserNewElo })
        .eq('id', loser.id);

      if (errorWinner || errorLoser) {
        throw new Error('Error updating Elo');
      }

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === winner.id) return { ...p, elo: winnerNewElo };
          if (p.id === loser.id) return { ...p, elo: loserNewElo };
          return p;
        })
      );

      showNewPair();
    } catch (error) {
      console.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Sort players by Elo descending
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Who is better?</h1>

      {loading ? (
        <p style={styles.message}>Loading players...</p>
      ) : currentPair.length === 2 ? (
        <div style={styles.buttonsWrapper}>
          <button
            onClick={() => vote(0)}
            style={updating ? styles.buttonDisabled : styles.button}
            disabled={updating}
          >
            {currentPair[0].name}
          </button>
          <span style={styles.vs}>vs</span>
          <button
            onClick={() => vote(1)}
            style={updating ? styles.buttonDisabled : styles.button}
            disabled={updating}
          >
            {currentPair[1].name}
          </button>
        </div>
      ) : (
        <p style={styles.message}>Not enough players to compare.</p>
      )}

      <h2 style={{ ...styles.title, marginTop: 40 }}>Rankings</h2>
      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.thTd}>Rank</th>
            <th style={styles.thTd}>Player</th>
            <th style={styles.thTd}>Elo</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, idx) => (
            <tr
              key={p.id}
              style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
            >
              <td style={styles.thTd}>{idx + 1}</td>
              <td style={styles.thTd}>{p.name}</td>
              <td style={styles.thTd}>{p.elo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '40px auto',
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textAlign: 'center',
    backgroundColor: '#fefefe',
    color: '#222',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  title: {
    fontWeight: '700',
    fontSize: '2rem',
    marginBottom: 20,
    color: '#007BFF',
  },
  message: {
    fontSize: '1rem',
    color: '#555',
  },
  buttonsWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },
  button: {
    fontSize: '1.3rem',
    padding: '14px 28px',
    cursor: 'pointer',
    border: '2px solid #007BFF',
    borderRadius: 8,
    backgroundColor: 'white',
    color: '#007BFF',
    transition: 'all 0.3s ease',
    minWidth: 180,
    userSelect: 'none',
    outlineOffset: '4px',
  },
  buttonDisabled: {
    fontSize: '1.3rem',
    padding: '14px 28px',
    cursor: 'not-allowed',
    border: '2px solid #007BFF',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    color: '#aaa',
    minWidth: 180,
  },
  vs: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#555',
  },
  table: {
    margin: '25px auto 0',
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    borderRadius: 6,
  },
  thead: {
    backgroundColor: '#007BFF',
    color: 'white',
    textAlign: 'left',
  },
  thTd: {
    padding: '12px 16px',
    borderBottom: '1px solid #ddd',
    fontSize: '1rem',
  },
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  rowOdd: {
    backgroundColor: 'white',
  },
};
