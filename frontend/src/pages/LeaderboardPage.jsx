import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import GameLayout from "../components/layout/GameLayout";
import { fetchLeaderboardThunk } from "../store/leaderboardSlice";

export default function LeaderboardPage() {
  const dispatch = useDispatch();
  const { entries, status, generatedAt } = useSelector((state) => state.leaderboard);

  useEffect(() => {
    dispatch(fetchLeaderboardThunk());
  }, [dispatch]);

  return (
    <GameLayout title="Leaderboard" subtitle="Top players ranked by score with streak momentum.">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5" data-testid="leaderboard-table-shell">
        <p className="mb-4 text-xs text-white/60" data-testid="leaderboard-generated-at-label">
          {generatedAt ? `Updated: ${new Date(generatedAt).toLocaleString()}` : "Loading updates..."}
        </p>

        {status === "loading" ? (
          <p data-testid="leaderboard-loading-state">Loading leaderboard...</p>
        ) : (
          <div className="overflow-x-auto" data-testid="leaderboard-table-scroll-wrapper">
            <table className="min-w-full text-left text-sm" data-testid="leaderboard-table">
              <thead>
                <tr className="border-b border-white/10 text-white/70">
                  <th className="px-2 py-2" data-testid="leaderboard-header-rank">Rank</th>
                  <th className="px-2 py-2" data-testid="leaderboard-header-name">Player</th>
                  <th className="px-2 py-2" data-testid="leaderboard-header-mode">Mode</th>
                  <th className="px-2 py-2" data-testid="leaderboard-header-streak">Streak</th>
                  <th className="px-2 py-2" data-testid="leaderboard-header-score">Score</th>
                  <th className="px-2 py-2" data-testid="leaderboard-header-solved">Solved</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.rank} className="border-b border-white/5" data-testid={`leaderboard-row-${entry.rank}`}>
                    <td className="px-2 py-3" data-testid={`leaderboard-rank-${entry.rank}`}>#{entry.rank}</td>
                    <td className="px-2 py-3" data-testid={`leaderboard-name-${entry.rank}`}>{entry.name}</td>
                    <td className="px-2 py-3" data-testid={`leaderboard-mode-${entry.rank}`}>{entry.mode}</td>
                    <td className="px-2 py-3" data-testid={`leaderboard-streak-${entry.rank}`}>{entry.streak}</td>
                    <td className="px-2 py-3" data-testid={`leaderboard-score-${entry.rank}`}>{entry.total_score}</td>
                    <td className="px-2 py-3" data-testid={`leaderboard-solved-${entry.rank}`}>{entry.total_solved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </GameLayout>
  );
}