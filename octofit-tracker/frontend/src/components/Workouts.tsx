import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);
        if (isActive) {
          setSuggestions(payload.suggestions ?? []);
        }
      } catch {
        if (isActive) {
          setError('Unable to load workout suggestions');
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
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p role="status">Loading workout suggestions...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p role="alert">Unable to load workout suggestions</p></CapabilityCard>;
  }

  if (suggestions.length === 0) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p>No workout suggestions</p></CapabilityCard>;
  }

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.title ?? 'workout'}-${index}`}>{suggestion.title ?? 'Workout'} • {suggestion.reason ?? 'Recommended for your activity pattern'}</li>)}</ul></CapabilityCard>;
}
