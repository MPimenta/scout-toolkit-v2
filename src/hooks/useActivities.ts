import { useState, useEffect } from 'react';

interface EducationalGoal {
  id: string;
  title: Record<string, string> | string; // JSONB field - multilingual content
  code: string;
}

interface Sdg {
  id: string;
  number: number;
  name: Record<string, string> | string; // JSONB field - multilingual content
  icon_url: string;
}

interface ActivityType {
  id: string;
  name: Record<string, string> | string; // JSONB field - multilingual content
}

interface Activity {
  id: string;
  name: Record<string, string> | string; // JSONB field - multilingual content
  description: Record<string, string> | string; // JSONB field - multilingual content
  materials: Record<string, string> | string; // JSONB field - multilingual content
  approximate_duration_minutes: number;
  group_size: 'small' | 'medium' | 'large';
  effort_level: 'low' | 'medium' | 'high';
  location: 'inside' | 'outside';
  age_group: 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders';
  image_url?: string;
  created_at: string;
  activity_type: ActivityType;
  educational_goals: EducationalGoal[];
  sdgs: Sdg[];
}

interface ActivitiesResponse {
  activities: Activity[];
  total: number;
}

interface UseActivitiesOptions {
  search?: string;
  activityType?: string;
  effortLevel?: string;
  groupSize?: string;
  location?: string;
  ageGroup?: string;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (options.search) params.append('search', options.search);
        if (options.activityType) params.append('activityType', options.activityType);
        if (options.effortLevel) params.append('effortLevel', options.effortLevel);
        if (options.groupSize) params.append('groupSize', options.groupSize);
        if (options.location) params.append('location', options.location);
        if (options.ageGroup) params.append('ageGroup', options.ageGroup);

        const response = await fetch(`/api/activities?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.statusText}`);
        }

        const data: ActivitiesResponse = await response.json();
        setActivities(data.activities);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching activities');
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [options.search, options.activityType, options.effortLevel, options.groupSize, options.location, options.ageGroup]);

  return {
    activities,
    total,
    loading,
    error,
  };
}
