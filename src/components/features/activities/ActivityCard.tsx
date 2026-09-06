'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp, MapPin, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';

/**
 * Interface for educational goal data
 */
interface EducationalGoal {
  id: string;
  title: string; // Now simple string after migration
  code: string;
}

/**
 * Interface for SDG data
 */
interface Sdg {
  id: string;
  number: number;
  name: string; // Now simple string after migration
  icon_url: string;
}

/**
 * Interface for activity type data
 */
interface ActivityType {
  id: string;
  name: string; // Now simple string after migration
}

/**
 * Interface for activity data
 */
interface Activity {
  id: string;
  name: string; // Now simple string after migration
  description: string; // Now simple string after migration
  materials: string; // Now simple string after migration
  approximate_duration_minutes: number;
  group_size: string; // API returns string, not union type
  effort_level: string; // API returns string, not union type
  location: string; // API returns string, not union type
  age_group: string; // API returns string, not union type
  image_url?: string;
  created_at: string;
  activity_type: ActivityType;
  educational_goals: EducationalGoal[];
  sdgs: Sdg[];
}

/**
 * Props for the ActivityCard component
 */
interface ActivityCardProps {
  activity: Activity;
}

/**
 * Helper function to get group size display text
 * @param size - The group size value
 * @returns The display text for the group size
 */

/**
 * ActivityCard component for displaying activity information in a card format
 * Shows activity details, metadata, and provides navigation to activity details
 * @param activity - The activity data to display
 * @returns JSX element representing the activity card
 */
export function ActivityCard({ activity }: ActivityCardProps) {
  const { t } = useLocale();
  const name = activity.name;
  const description = activity.description;
  const activityTypeName = activity.activity_type.name;

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
              <p className="text-sm">{t('activities.noImage')}</p>
            </div>
          </div>
        )}
        
        {/* Activity type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {activityTypeName}
          </Badge>
        </div>

                 {/* SDG Icons Overlay - Bottom Right */}
         {activity.sdgs.length > 0 && (
           <div className="absolute bottom-3 right-3 flex gap-1">
             {activity.sdgs.slice(0, 4).map((sdg) => (
               <div
                 key={sdg.id}
                 className="w-8 h-8 rounded-md flex items-center justify-center shadow-lg border-2 border-white bg-white overflow-hidden"
                                   title={t('activities.sdgTitle', { number: sdg.number, name: sdg.name })}
               >
                 {sdg.icon_url ? (
                   <img
                     src={sdg.icon_url}
                     alt={t('activities.sdgPrefix', { number: sdg.number })}
                     className="w-full h-full object-contain"
                   />
                 ) : (
                   // Fallback to colored square if no icon
                   <div
                     className="w-full h-full rounded-md flex items-center justify-center text-white text-xs font-bold"
                     style={{
                       backgroundColor: `hsl(${(sdg.number * 20) % 360}, 70%, 50%)`
                     }}
                   >
                     {sdg.number}
                   </div>
                 )}
               </div>
             ))}
             {activity.sdgs.length > 4 && (
               <div
                 className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white bg-gray-600"
                 title={t('activities.sdgMore', { count: activity.sdgs.length - 4 })}
               >
                 +{activity.sdgs.length - 4}
               </div>
             )}
           </div>
         )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg overflow-hidden text-ellipsis display-webkit-box [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{name}</CardTitle>
        <CardDescription className="overflow-hidden text-ellipsis display-webkit-box [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        {/* Activity details */}
        <div className="space-y-3">
          {/* Duration, Group Size, Effort */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{activity.approximate_duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{enumLabel(t, 'groupSize', activity.group_size)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{enumLabel(t, 'effort', activity.effort_level)}</span>
            </div>
          </div>

          {/* Location and Age Group */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{enumLabel(t, 'location', activity.location)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{enumLabel(t, 'ageGroup', activity.age_group)}</span>
            </div>
          </div>

          {/* Educational Goals */}
          {activity.educational_goals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('activities.goalsColon')}</p>
              <div className="flex flex-wrap gap-1">
                {activity.educational_goals.slice(0, 3).map((goal) => (
                  <Badge key={goal.id} variant="outline" className="text-xs">
                                         {goal.title}
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


        </div>

        {/* View Details Button */}
        <div className="mt-4 pt-3 border-t">
          <Link
            href={`/activities/${activity.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            {t('activities.viewDetails')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
