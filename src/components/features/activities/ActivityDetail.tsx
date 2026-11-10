'use client';

import { BackControl } from '@/components/pwa/BackControl';
import { useActivity } from '@/hooks/useActivity';
import { useTrackActivityView } from '@/hooks/useUsageTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DivisionPill } from '@/components/ui/DivisionPill';
import { Eyebrow } from '@/components/ui/brand-blocks';
import { BookOpen, Star, Plus } from 'lucide-react';
import { Fact } from '@/components/ui/Fact';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActivityRating } from './ActivityRating';
import { AddToProgramModal } from './AddToProgramModal';
import { SuggestEditForm } from './SuggestEditForm';
import {
  ChallengeList,
  CollapsibleSection,
  DivisionObjectives,
  InstructionsView,
  RiskCards,
  SdgJustifications,
} from './ActivityDetailSections';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { useState } from 'react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel, enumLabelList } from '@/lib/locale/labels';
import { formatDuration } from '@/lib/activities/duration-range';

interface ActivityDetailProps {
  activityId: string;
}

/**
 * Reading order of a leader preparing a session: what it is, what I need, how to run it,
 * how to keep it safe (always open), what it develops, why it matters. Identity (key facts,
 * divisions, actions, source and licence) appears once, in the header.
 */
export function ActivityDetail({ activityId }: ActivityDetailProps) {
  const { t } = useLocale();
  const { activity, loading, error } = useActivity(activityId);
  useTrackActivityView(activity?.id);
  const [showAddToProgramModal, setShowAddToProgramModal] = useState(false);
  const showSuggestions = useFeature('edit-suggestions');

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-destructive">{t('activities.loadError')}</h1>
        <p className="text-muted-foreground">{error || t('activities.notFound')}</p>
      </div>
    );
  }

  const objectives = activity.objectives ?? [];
  const challenges = activity.challenges ?? [];
  const sourceLink = activity.source_url || activity.source?.url || null;

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <BackControl fallbackHref="/activities" label={t('back.activities')} />
      {/* Header: identity, key facts, divisions, actions, source (shown once) */}
      <header className="grid gap-5 md:grid-cols-[280px_1fr]">
        {activity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.image_url}
            alt={activity.name}
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-muted">
            <div className="text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-2 h-12 w-12" />
              <p>{t('activities.noImage')}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {activity.format ? (
            <Eyebrow>{[activity.format.name, activity.focus?.name, activity.secondary_focus?.name].filter(Boolean).join(' · ')}</Eyebrow>
          ) : (
            activity.activity_types.length > 0 && <Eyebrow>{activity.activity_types.map((type) => type.name).join(' · ')}</Eyebrow>
          )}
          <h1 className="text-display font-bold">{activity.name}</h1>
          {activity.source && (
            <p className="text-sm text-muted-foreground">
              {t('activityDetail.source')}:{' '}
              {sourceLink ? (
                <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="link-emphasis">
                  {activity.source.name} ↗
                </a>
              ) : (
                activity.source.name
              )}
              {activity.source.license ? ` · ${activity.source.license}` : ''}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem]">
            <Fact kind="duration">{formatDuration(activity.approximate_duration_minutes, activity.duration_min_minutes, activity.duration_max_minutes)}</Fact>
            <Fact kind="groupSize">{enumLabelList(t, 'groupSize', activity.group_sizes)}</Fact>
            <Fact kind="effort">{enumLabel(t, 'effort', activity.effort_level)}</Fact>
            <Fact kind="location">{enumLabelList(t, 'location', activity.locations)}</Fact>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label={t('activityDetail.divisions')}>
            {activity.age_groups.map((group) => (
              <li key={group}>
                <DivisionPill ageGroup={group} code={enumLabel(t, 'ageGroup', group)} labelOnly className="px-3 py-1 text-sm" />
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={() => setShowAddToProgramModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('programs.addToProgram')}
            </Button>
            <Button variant="outline" asChild>
              <a href="#avaliacoes">
                <Star className="mr-2 h-4 w-4" />
                {t('activityDetail.rate')}
              </a>
            </Button>
            {showSuggestions && (
              <Button variant="outline" asChild>
                <a href="#sugerir">{t('activityDetail.suggestEdit')}</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t('activityDetail.summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{activity.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('activityDetail.materials')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{activity.materials}</p>
        </CardContent>
      </Card>

      {activity.instructions ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('activityDetail.howTo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <InstructionsView text={activity.instructions} />
          </CardContent>
        </Card>
      ) : null}

      <RiskCards
        physical={{
          level: activity.physical_risk_level,
          risk: activity.physical_risk,
          mitigation: activity.physical_mitigation,
        }}
        psychological={{
          level: activity.psychological_risk_level,
          risk: activity.psychological_risk,
          mitigation: activity.psychological_mitigation,
        }}
      />

      {objectives.length > 0 && (
        <CollapsibleSection title={t('activityDetail.objectives')} id="objetivos">
          <DivisionObjectives objectives={objectives} />
        </CollapsibleSection>
      )}

      {activity.sdgs && activity.sdgs.length > 0 && (
        <CollapsibleSection title={t('activityDetail.sdgs')} id="ods">
          <SdgJustifications sdgs={activity.sdgs} />
        </CollapsibleSection>
      )}

      {challenges.length > 0 && (
        <CollapsibleSection title={t('activityDetail.challenges')} id="desafios">
          <ChallengeList challenges={challenges} />
        </CollapsibleSection>
      )}

      <section id="avaliacoes" aria-label="Avaliações" className="scroll-mt-20">
        <Card>
          <CardContent className="pt-6">
            <ActivityRating activityId={activity.id} />
          </CardContent>
        </Card>
      </section>

      {showSuggestions && (
        <div id="sugerir" className="scroll-mt-20">
          <SuggestEditForm activityId={activity.id} />
        </div>
      )}

      {showAddToProgramModal && (
        <AddToProgramModal activity={activity} onClose={() => setShowAddToProgramModal(false)} />
      )}
    </div>
  );
}
