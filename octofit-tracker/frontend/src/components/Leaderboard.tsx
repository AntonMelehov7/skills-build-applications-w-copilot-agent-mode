import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const payload = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (isActive) {
          setEntries(payload.leaderboard ?? []);
        }
      } catch {
        if (isActive) {
          setError('Unable to load leaderboard');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p role="status">Loading leaderboard...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p role="alert">Unable to load leaderboard</p></CapabilityCard>;
  }

  if (entries.length === 0) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p>No leaderboard</p></CapabilityCard>;
  }

  return <CapabilityCard title="Leaderboard" description="Compare team point totals."><ol>{entries.map((entry, index) => <li key={`${entry.teamName ?? 'team'}-${index}`}>{entry.teamName ?? 'Team'} • {entry.totalPoints ?? 0} points • rank {entry.rank ?? index + 1}</li>)}</ol></CapabilityCard>;
}
