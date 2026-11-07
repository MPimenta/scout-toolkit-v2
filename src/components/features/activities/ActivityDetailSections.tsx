'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DivisionPill } from '@/components/ui/DivisionPill';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';
import { DIVISIONS } from '@/lib/design/tokens';
import { parseInstructions } from '@/lib/activities/instructions';

/* ---------- Instructions ---------- */

export function InstructionsView({ text }: { text: string | null | undefined }) {
  const sections = parseInstructions(text);
  if (sections.length === 0) return null;
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={`${section.title ?? 'intro'}-${index}`}>
          {section.title && <h3 className="mb-1 text-base font-bold text-primary">{section.title}</h3>}
          {section.blocks.map((block, blockIndex) =>
            block.type === 'steps' ? (
              <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ol>
            ) : (
              <p key={blockIndex} className="mb-2 last:mb-0">
                {block.text}
              </p>
            )
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Safety ---------- */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskInfo {
  level?: RiskLevel | null;
  risk?: string | null;
  mitigation?: string | null;
}

const LEVEL_CLASSES: Record<RiskLevel, string> = {
  low: 'border border-border text-foreground',
  medium: 'border border-primary bg-secondary text-secondary-foreground',
  high: 'border border-destructive bg-destructive text-destructive-foreground',
};
const LEVEL_BARS: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };

function LevelBadge({ level }: { level: RiskLevel }) {
  const { t } = useLocale();
  return (
    <span
      data-level={level}
      className={`inline-flex items-center gap-2 rounded-lg px-2 py-0.5 text-sm font-bold ${LEVEL_CLASSES[level]}`}
    >
      <span aria-hidden className="inline-flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <i
            key={bar}
            className={`block w-1 bg-current ${bar <= LEVEL_BARS[level] ? '' : 'opacity-25'}`}
            style={{ height: `${4 + bar * 3}px` }}
          />
        ))}
      </span>
      {t(`activityDetail.level.${level}`)}
    </span>
  );
}

function hasContent(info: RiskInfo): boolean {
  return Boolean(info.level || info.risk?.trim() || info.mitigation?.trim());
}

function RiskCard({ title, info }: { title: string; info: RiskInfo }) {
  const { t } = useLocale();
  return (
    <div className="rounded-lg border p-4" data-testid="risk-card">
      <h3 className="font-bold">{title}</h3>
      {hasContent(info) ? (
        <>
          {info.level && (
            <p className="my-2">
              <LevelBadge level={info.level} />
            </p>
          )}
          {info.risk?.trim() && (
            <>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('activityDetail.whatCanGoWrong')}
              </p>
              <p className="whitespace-pre-line">{info.risk}</p>
            </>
          )}
          {info.mitigation?.trim() && (
            <>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('activityDetail.howToReduce')}
              </p>
              <p className="whitespace-pre-line">{info.mitigation}</p>
            </>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t('activityDetail.riskNotAvailable')}</p>
      )}
    </div>
  );
}

/** Safety is always expanded: two cards (physical, psychological) or an explicit notice. */
export function RiskCards({ physical, psychological }: { physical: RiskInfo; psychological: RiskInfo }) {
  const { t } = useLocale();
  const any = hasContent(physical) || hasContent(psychological);
  return (
    <Card id="seguranca" aria-labelledby="seguranca-titulo">
      <CardHeader>
        <CardTitle id="seguranca-titulo">{t('activityDetail.safety')}</CardTitle>
      </CardHeader>
      <CardContent>
        {any ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <RiskCard title={t('activityDetail.physicalRisk')} info={physical} />
            <RiskCard title={t('activityDetail.psychologicalRisk')} info={psychological} />
          </div>
        ) : (
          <div role="note" className="rounded-lg border border-dashed p-4">
            <p className="font-bold">{t('activityDetail.noRiskAnalysis')}</p>
            <p className="text-sm text-muted-foreground">{t('activityDetail.noRiskReminder')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Collapsible section (open on desktop, closed on phones) ---------- */

export function CollapsibleSection({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches) setOpen(true);
  }, []);
  return (
    <details
      id={id}
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="rounded-lg border border-t-[3px] border-t-accent bg-card px-6"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center py-3 text-xl font-bold">{title}</summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

/* ---------- Objectives per division ---------- */

export interface ObjectiveItem {
  goal_id: string;
  code: string;
  title: string;
  age_group: string;
  behaviour?: string | null;
}

function divisionLabel(t: ReturnType<typeof useLocale>['t'], ageGroup: string): string {
  return enumLabel(t, 'ageGroup', ageGroup) || DIVISIONS.find((d) => d.ageGroup === ageGroup)?.name || ageGroup;
}

export function DivisionObjectives({ objectives }: { objectives: ObjectiveItem[] }) {
  const { t } = useLocale();
  const order = DIVISIONS.map((division) => division.ageGroup as string);
  const groups = [...new Set(objectives.map((row) => row.age_group))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const [selected, setSelected] = useState<string | null>(null);
  if (groups.length === 0) return null;
  const current = selected && groups.includes(selected) ? selected : groups[0]!;
  const rows = objectives.filter((row) => row.age_group === current);

  return (
    <div>
      {groups.length > 1 ? (
        <div role="tablist" aria-label={t('activityDetail.divisions')} className="mb-3 flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              role="tab"
              aria-selected={group === current}
              onClick={() => setSelected(group)}
              className={`min-h-11 rounded-lg border-2 p-1 ${group === current ? 'border-accent' : 'border-transparent'}`}
            >
              <DivisionPill ageGroup={group} code={divisionLabel(t, group)} labelOnly className="px-3 py-1 text-sm" />
            </button>
          ))}
        </div>
      ) : (
        <h3 className="mb-3">
          <DivisionPill ageGroup={current} code={divisionLabel(t, current)} labelOnly className="px-3 py-1 text-sm" />
        </h3>
      )}
      {current === 'leaders' && (
        <p className="mb-2 text-sm text-muted-foreground">{t('activityDetail.leadersReference')}</p>
      )}
      <ul>
        {rows.map((row) => (
          <li key={`${row.goal_id}-${row.age_group}`} className="border-t py-3 first:border-t-0">
            <DivisionPill ageGroup={row.age_group} code={row.code} title={row.title} />{' '}
            <span>{row.title}</span>
            {row.behaviour?.trim() && (
              <p className="mt-1 text-[0.9375rem]">
                <strong className="text-teal-dark">{t('activityDetail.howToObserve')}</strong> {row.behaviour}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- SDGs with justification ---------- */

export interface SdgItem {
  id: string;
  number: number;
  name: string;
  icon_url?: string | null;
  justification?: string | null;
}

export function SdgJustifications({ sdgs }: { sdgs: SdgItem[] }) {
  if (sdgs.length === 0) return null;
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {sdgs.map((sdg) => (
        <li key={sdg.id} className="grid grid-cols-[64px_1fr] gap-3">
          {sdg.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sdg.icon_url} alt={`ODS ${sdg.number}: ${sdg.name}`} width={64} height={64} className="h-16 w-16 rounded-lg object-contain" />
          ) : (
            <span aria-hidden className="grid h-16 w-16 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
              {sdg.number}
            </span>
          )}
          <div>
            <p className="font-bold">{sdg.name}</p>
            {sdg.justification?.trim() && <p className="mt-1">{sdg.justification}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Challenges ---------- */

export interface ChallengeItem {
  id: string;
  code: string;
  title: string;
  age_group: string;
  type_name: string;
}

export function ChallengeList({ challenges }: { challenges: ChallengeItem[] }) {
  const { t } = useLocale();
  if (challenges.length === 0) return null;
  const types = [...new Set(challenges.map((challenge) => challenge.type_name))];
  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">{t('activityDetail.challengesNote')}</p>
      {types.map((type) => (
        <section key={type} className="mb-3">
          <h3 className="text-sm font-bold text-primary">{type}</h3>
          <ul>
            {challenges
              .filter((challenge) => challenge.type_name === type)
              .map((challenge) => (
                <li key={challenge.id} className="flex flex-wrap items-start gap-2 border-t py-2 first:border-t-0">
                  <Badge variant="outline">{challenge.code}</Badge>
                  <DivisionPill ageGroup={challenge.age_group} code={divisionLabel(t, challenge.age_group)} labelOnly />
                  <span>{challenge.title}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
