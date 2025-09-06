import { useState, useEffect } from 'react';

interface EducationalGoal {
  id: string;
  title: string; // Now simple string after migration
  description?: string; // Now simple string after migration
  code: string;
  area: {
    id: string;
    name: string; // Now simple string after migration
    description?: string; // Now simple string after migration
    icon: string;
    code: string;
  };
}

interface Sdg {
  id: string;
  number: number;
  name: string; // Now simple string after migration
  description: string; // Now simple string after migration
  icon_url: string;
}

interface ActivityType {
  id: string;
  name: string; // Now simple string after migration
  description?: string; // Now simple string after migration
}

interface Activity {
  id: string;
  name: string; // Now simple string after migration
  description: string; // Now simple string after migration
  materials: string; // Now simple string after migration
  approximate_duration_minutes: number;
  group_size: 'small' | 'medium' | 'large';
  effort_level: 'low' | 'medium' | 'high';
  location: 'inside' | 'outside';
  age_group: 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders';
  image_url?: string;
  created_at: string;
  updated_at: string;
  activity_type: ActivityType;
  educational_goals: EducationalGoal[];
  sdgs: Sdg[];
}

interface UseActivityReturn {
  activity: Activity | null;
  loading: boolean;
  error: string | null;
}

export function useActivity(id: string): UseActivityReturn {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Activity ID is required');
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/activities/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Atividade não encontrada');
          }
          throw new Error('Erro ao carregar atividade');
        }
        
        const data = await response.json();
        setActivity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  return { activity, loading, error };
}
