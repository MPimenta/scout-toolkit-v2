import { useState, useEffect } from 'react';

interface EducationalGoal {
  id: string;
  title: string; // Now simple string after migration
  description?: string; // Now simple string after migration
  code: string;
  age_groups?: string[];
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
  justification?: string | null;
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
  instructions?: string | null;
  approximate_duration_minutes: number;
  group_sizes: Array<'small' | 'medium' | 'large'>;
  effort_level: 'low' | 'medium' | 'high';
  locations: Array<'inside' | 'outside'>;
  age_groups: Array<'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders'>;
  image_url?: string;
  created_at: string;
  updated_at: string;
  activity_types: ActivityType[];
  educational_goals: EducationalGoal[];
  sdgs: Sdg[];
  physical_risk_level?: 'low' | 'medium' | 'high' | null;
  physical_risk?: string | null;
  physical_mitigation?: string | null;
  psychological_risk_level?: 'low' | 'medium' | 'high' | null;
  psychological_risk?: string | null;
  psychological_mitigation?: string | null;
  source_url?: string | null;
  source?: { id: string; code: string; name: string; url: string | null; license: string | null } | null;
  objectives?: Array<{
    goal_id: string;
    code: string;
    title: string;
    age_group: string;
    behaviour: string | null;
  }>;
  challenges?: Array<{ id: string; code: string; title: string; age_group: string; type_code: string; type_name: string }>;
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
