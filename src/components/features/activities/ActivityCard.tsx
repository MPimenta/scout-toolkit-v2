'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ObjectivePill } from './ObjectivePill';
import { Badge } from '@/components/ui/badge';
import { Fact } from '@/components/ui/Fact';
import { DivisionPill } from '@/components/ui/DivisionPill';
import { AGE_GROUP_VALUES } from '@/lib/activities/category-values';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel, enumLabelList } from '@/lib/locale/labels';
import { formatDuration } from '@/lib/activities/duration-range';

/**
 * Interface for educational goal data
 */
interface EducationalGoal {
  id: string;
  age_groups?: string[];
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
  duration_min_minutes?: number | null;
  duration_max_minutes?: number | null;
  group_sizes: string[]; // API returns strings, not union types
  effort_level: string; // API returns string, not union type
  locations: string[];
  age_groups: string[];
  image_url?: string;
  created_at: string;
  activity_types: ActivityType[];
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
  // Every division of the activity, always in the same order.
  const divisions = AGE_GROUP_VALUES.filter((value) => activity.age_groups.includes(value));
  const activityTypeName = activity.activity_types.map((type) => type.name).join(', ');

  const sdgBadges = activity.sdgs.length > 0 && (
    <div className="flex gap-1">
      {activity.sdgs.slice(0, 4).map((sdg) => (
        <div
          key={sdg.id}
          className="w-7 h-7 rounded-md flex items-center justify-center border border-white bg-white overflow-hidden shadow-sm"
          title={t('activities.sdgTitle', { number: sdg.number, name: sdg.name })}
        >
          {sdg.icon_url ? (
            <img
              src={sdg.icon_url}
              alt={t('activities.sdgPrefix', { number: sdg.number })}
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: `hsl(${(sdg.number * 20) % 360}, 70%, 40%)` }}
            >
              {sdg.number}
            </div>
          )}
        </div>
      ))}
      {activity.sdgs.length > 4 && (
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold bg-muted-foreground"
          title={t('activities.sdgMore', { count: activity.sdgs.length - 4 })}
        >
          +{activity.sdgs.length - 4}
        </div>
      )}
    </div>
  );

  return (
    // The title link stretches over the whole card (after:inset-0), so a click or
    // Enter anywhere on the card opens the activity.
    <Card className="group relative h-full flex flex-col card-lift focus-within:ring-2 focus-within:ring-ring">
      {activity.image_url ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg">
          <Image
            src={activity.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {activityTypeName && (
            <Badge variant="outline" className="absolute top-3 left-3 bg-background text-foreground">
              {activityTypeName}
            </Badge>
          )}
          {sdgBadges && <div className="absolute bottom-3 right-3">{sdgBadges}</div>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-t-lg border-b bg-muted px-4 py-3 min-h-14">
          {activityTypeName ? (
            <Badge variant="outline" className="bg-background text-foreground">
              {activityTypeName}
            </Badge>
          ) : (
            <span />
          )}
          {sdgBadges}
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-lg overflow-hidden text-ellipsis display-webkit-box [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
          <Link
            href={`/activities/${activity.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-lg group-hover:underline"
          >
            {name}
          </Link>
        </CardTitle>
        <CardDescription className="overflow-hidden text-ellipsis display-webkit-box [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Fact kind="duration">{formatDuration(activity.approximate_duration_minutes, activity.duration_min_minutes, activity.duration_max_minutes)}</Fact>
          <Fact kind="groupSize">{enumLabelList(t, 'groupSize', activity.group_sizes, 2)}</Fact>
          <Fact kind="effort">{enumLabel(t, 'effort', activity.effort_level)}</Fact>
          <Fact kind="location">{enumLabelList(t, 'location', activity.locations, 2)}</Fact>
        </div>

        {divisions.length > 0 && (
          <div className="flex flex-wrap gap-1" data-testid="card-divisions">
            {divisions.map((division) => {
              const full = enumLabel(t, 'ageGroup', division);
              return (
                <DivisionPill
                  key={division}
                  ageGroup={division}
                  code={t(`enums.ageGroupShort.${division}`)}
                  accessibleName={full}
                  title={full}
                />
              );
            })}
          </div>
        )}

        {activity.educational_goals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activity.educational_goals.slice(0, 3).map((goal) => (
              <ObjectivePill key={goal.id} objective={goal} activityAgeGroups={activity.age_groups} />
            ))}
            {activity.educational_goals.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{activity.educational_goals.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
