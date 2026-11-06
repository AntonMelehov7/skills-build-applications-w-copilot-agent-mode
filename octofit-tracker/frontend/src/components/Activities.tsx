import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const payload = await getJson<{ activities: Activity[] }>('/api/activities');
        if (isActive) {
          setActivities(payload.activities ?? []);
        }
      } catch {
        if (isActive) {
          setError('Unable to load activities');
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
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p role="status">Loading activities...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p role="alert">Unable to load activities</p></CapabilityCard>;
  }

  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p>No activities</p></CapabilityCard>;
  }

  return <CapabilityCard title="Activities" description="Track student activity minutes and points."><ul>{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`}>{activity.type ?? 'Activity'} • {activity.minutes ?? 0} minutes • {activity.points ?? 0} pts</li>)}</ul></CapabilityCard>;
}
