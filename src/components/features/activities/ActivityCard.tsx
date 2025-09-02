import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp, MapPin, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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

interface ActivityCardProps {
  activity: Activity;
}

// Helper function to get Portuguese text from JSONB
function getPortugueseText(jsonbField: Record<string, string> | string): string {
  if (!jsonbField) return '';
  if (typeof jsonbField === 'string') return jsonbField;
  if (jsonbField.pt) return jsonbField.pt;
  if (jsonbField.pt_PT) return jsonbField.pt_PT;
  if (jsonbField.pt_BR) return jsonbField.pt_BR;
  if (jsonbField.en) return jsonbField.en;
  if (jsonbField.en_US) return jsonbField.en_US;
  if (jsonbField.en_GB) return jsonbField.en_GB;
  // Fallback to first available language or key
  const firstKey = Object.keys(jsonbField)[0];
  return firstKey ? jsonbField[firstKey] : '';
}

// Helper function to get group size display text
function getGroupSizeText(size: string): string {
  const sizeMap = {
    small: 'Pequeno (2-6)',
    medium: 'Médio (7-15)',
    large: 'Grande (16+)',
  };
  return sizeMap[size as keyof typeof sizeMap] || size;
}

// Helper function to get effort level display text
function getEffortLevelText(level: string): string {
  const levelMap = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
  };
  return levelMap[level as keyof typeof levelMap] || level;
}

// Helper function to get age group display text
function getAgeGroupText(ageGroup: string): string {
  const ageMap = {
    cub_scouts: 'Lobitos (6-10)',
    scouts: 'Exploradores (10-14)',
    adventurers: 'Pioneiros (14-18)',
    rovers: 'Caminheiros (18-22)',
    leaders: 'Líderes (22+)',
  };
  return ageMap[ageGroup as keyof typeof ageMap] || ageGroup;
}

// Helper function to get location display text
function getLocationText(location: string): string {
  const locationMap = {
    inside: 'Interior',
    outside: 'Exterior',
  };
  return locationMap[location as keyof typeof locationMap] || location;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const name = getPortugueseText(activity.name);
  const description = getPortugueseText(activity.description);
  const activityTypeName = getPortugueseText(activity.activity_type.name);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        {activity.image_url ? (
          <Image
            src={activity.image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem imagem</p>
            </div>
          </div>
        )}
        
        {/* Activity type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {activityTypeName}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg overflow-hidden text-ellipsis display-webkit-box [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{name}</CardTitle>
        <CardDescription className="overflow-hidden text-ellipsis display-webkit-box [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        {/* Activity details */}
        <div className="space-y-3">
          {/* Duration, Group Size, Effort */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{activity.approximate_duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{getGroupSizeText(activity.group_size)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{getEffortLevelText(activity.effort_level)}</span>
            </div>
          </div>

          {/* Location and Age Group */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{getLocationText(activity.location)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{getAgeGroupText(activity.age_group)}</span>
            </div>
          </div>

          {/* Educational Goals */}
          {activity.educational_goals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Objetivos Educativos:</p>
              <div className="flex flex-wrap gap-1">
                {activity.educational_goals.slice(0, 3).map((goal) => (
                  <Badge key={goal.id} variant="outline" className="text-xs">
                    {getPortugueseText(goal.title)}
                  </Badge>
                ))}
                {activity.educational_goals.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{activity.educational_goals.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* SDGs */}
          {activity.sdgs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">ODS:</p>
              <div className="flex flex-wrap gap-1">
                {activity.sdgs.slice(0, 3).map((sdg) => (
                  <Badge key={sdg.id} variant="outline" className="text-xs">
                    ODS {sdg.number}
                  </Badge>
                ))}
                {activity.sdgs.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{activity.sdgs.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <div className="mt-4 pt-3 border-t">
          <Link
            href={`/activities/${activity.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            Ver Detalhes
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
