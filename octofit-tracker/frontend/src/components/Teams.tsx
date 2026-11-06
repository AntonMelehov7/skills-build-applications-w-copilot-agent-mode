import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const payload = await getJson<{ teams: Team[] }>('/api/teams');
        if (isActive) {
          setTeams(payload.teams ?? []);
        }
      } catch {
        if (isActive) {
          setError('Unable to load teams');
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
    return <CapabilityCard title="Teams" description="Manage teams and members."><p role="status">Loading teams...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><p role="alert">Unable to load teams</p></CapabilityCard>;
  }

  if (teams.length === 0) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><p>No teams</p></CapabilityCard>;
  }

  return <CapabilityCard title="Teams" description="Manage teams and members."><ul>{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`}>{team.name ?? 'Team'} • {team.members?.join(', ') ?? 'No members'}</li>)}</ul></CapabilityCard>;
}
