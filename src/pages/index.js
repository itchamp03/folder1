import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const K = 30;

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*');
    if (error) console.error('Error fetching players:', error);
    else setPlayers(data);
  };

  const expectedScore = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

  const updateElo = (winner, loser) => {
    const expectedWinner = expectedScore(winner.elo, loser.elo);
    const expectedLoser = expectedScore(loser.elo, winner.elo);
    return {
      winnerNewElo: Math.round(winner.elo + K * (1 - expectedWinner)),
      loserNewElo: Math.round(loser.elo + K * (0 - expectedLoser)),
    };
  };

  const getRandomPair = () => {
    if (players.length < 2) return [];
    let i = Math.floor(Math.random() * players.length);
    let j;
    do {
      j = Math.floor(Math.random() * players.length);
    } while (j === i);
    return [players[i], players[j]];
  };

  const showNewPair = () => {
    setCurrentPair(getRandomPair());
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (players.length >= 2) showNewPair();
  }, [players]);

  const vote = async (winnerIndex) => {
    const winner = currentPair[winnerIndex];
    const loser = currentPair[1 - winnerIndex];

    const { winnerNewElo, loserNewElo } = updateElo(winner, loser);

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

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === winner.id) return { ...p, elo: winnerNewElo };
        if (p.id === loser.id) return { ...p, elo: loserNewElo };
        return p;
      })
    );

    showNewPair();
  };

  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <main className="min-h-screen bg-gray-100 px-4 sm:px-6 py-8 text-center font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Who is better?</h1>

      {currentPair.length === 2 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={() => vote(0)}
            className="w-full sm:w-48 px-6 py-3 text-lg font-semibold border-2 border-blue-600 text-blue-600 bg-white rounded-xl hover:bg-blue-600 hover:text-white transition-all"
          >
            {currentPair[0].name}
          </button>

          <span className="text-gray-500 font-semibold">vs</span>

          <button
            onClick={() => vote(1)}
            className="w-full sm:w-48 px-6 py-3 text-lg font-semibold border-2 border-blue-600 text-blue-600 bg-white rounded-xl hover:bg-blue-600 hover:text-white transition-all"
          >
            {currentPair[1].name}
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-700 mb-4">Rankings</h2>
      <div className="overflow-x-auto max-w-full sm:max-w-2xl mx-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white text-sm sm:text-base">
            <tr>
              <th className="py-3 px-4 text-left">Rank</th>
              <th className="py-3 px-4 text-left">Player</th>
              <th className="py-3 px-4 text-left">Elo</th>
            </tr>
          </thead>
          <tbody className="text-sm sm:text-base text-gray-800">
            {sortedPlayers.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-3 px-4">{idx + 1}</td>
                <td className="py-3 px-4">{p.name}</td>
                <td className="py-3 px-4">{p.elo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
