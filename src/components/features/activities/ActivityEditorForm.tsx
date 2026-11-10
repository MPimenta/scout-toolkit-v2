'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';
import { ObjectivePicker, type PickerGoal } from './ObjectivePicker';
import { AGE_GROUP_VALUES, GROUP_SIZE_VALUES, LOCATION_VALUES } from '@/lib/activities/category-values';

export interface ObjectiveDraft {
  goal_id: string;
  age_group: string;
  behaviour: string;
}

export interface SdgDraft {
  sdg_id: string;
  justification: string;
}

interface SdgOption {
  id: string;
  number: number;
  name: string;
}

interface ChallengeOption {
  id: string;
  code: string;
  title: string;
  short_title?: string | null;
  integration_age_groups?: string[];
  age_group: string;
  type: { code: string; name: string };
}

interface SourceOption {
  id: string;
  name: string;
}

const STEPS = ['basics', 'instructions', 'safety', 'objectives', 'sdgs', 'challenges'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  basics: '1. Essencial',
  instructions: '2. Instruções',
  safety: '3. Segurança',
  objectives: '4. Objetivos',
  sdgs: '5. ODS',
  challenges: '6. Desafios',
};

const INSTRUCTIONS_TEMPLATE = 'Preparação\n…\n\nDesenvolvimento\n1. …\n2. …\n\nFecho e debriefing\n…';

const RISK_LEVELS = [
  { value: '', label: '—' },
  { value: 'low', label: 'Baixo' },
  { value: 'low_medium', label: 'Baixo a médio' },
  { value: 'medium', label: 'Médio' },
  { value: 'medium_high', label: 'Médio a alto' },
  { value: 'high', label: 'Alto' },
];

/** Drops the rows of divisions that are no longer selected. Returns what was kept and removed. */
export function pruneObjectives(
  rows: ObjectiveDraft[],
  ageGroups: readonly string[],
  codeFor: (goalId: string) => string
): { kept: ObjectiveDraft[]; removedCodes: string[] } {
  const kept = rows.filter((row) => ageGroups.includes(row.age_group));
  const removedCodes = [
    ...new Set(rows.filter((row) => !ageGroups.includes(row.age_group)).map((row) => codeFor(row.goal_id))),
  ];
  return { kept, removedCodes };
}

export function ActivityEditorForm({
  action,
  defaults,
  submitLabel,
  redirectTo = '/admin/atividades',
}: {
  action: string;
  redirectTo?: string;
  method?: string;
  defaults?: Partial<{
    name: string;
    description: string;
    materials: string;
    instructions: string | null;
    approximate_duration_minutes: number;
    group_sizes: string[];
    effort_level: string;
    locations: string[];
    age_groups: string[];
    format_id: string | null;
    focus_id: string | null;
    secondary_focus_id: string | null;
    duration_min_minutes: number | null;
    duration_max_minutes: number | null;
    educational_goal_ids: string[];
    objectives: ObjectiveDraft[];
    sdgs: SdgDraft[];
    challenge_ids: string[];
    physical_risk_level: string | null;
    physical_risk: string | null;
    physical_mitigation: string | null;
    psychological_risk_level: string | null;
    psychological_risk: string | null;
    psychological_mitigation: string | null;
    source_id: string | null;
    source_url: string | null;
    image_url: string;
  }>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>('basics');
  const [imageUrl, setImageUrl] = useState(defaults?.image_url ?? '');
  const [uploading, setUploading] = useState(false);
  const { t } = useLocale();

  async function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/uploads/activity-image', { method: 'POST', body });
      const payload = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
      if (!response.ok || !payload?.url) {
        // Keep the previous image on failure.
        setError(payload?.error?.message ?? 'Não foi possível carregar a imagem.');
      } else {
        setImageUrl(payload.url);
      }
    } catch {
      setError('Não foi possível carregar a imagem.');
    } finally {
      setUploading(false);
      input.value = '';
    }
  }
  const [groupSizes, setGroupSizes] = useState<string[]>(defaults?.group_sizes ?? ['medium']);
  const [locations, setLocations] = useState<string[]>(defaults?.locations ?? ['outside']);
  const [ageGroups, setAgeGroupsState] = useState<string[]>(defaults?.age_groups ?? ['scouts']);
  const [formatId, setFormatId] = useState(defaults?.format_id ?? '');
  const [focusId, setFocusId] = useState(defaults?.focus_id ?? '');
  const [secondaryFocusId, setSecondaryFocusId] = useState(defaults?.secondary_focus_id ?? '');
  const [formatOptions, setFormatOptions] = useState<ValueChoice[]>([]);
  const [focusOptions, setFocusOptions] = useState<ValueChoice[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveDraft[]>(defaults?.objectives ?? []);
  const [goals, setGoals] = useState<PickerGoal[]>([]);
  const [removedNotice, setRemovedNotice] = useState<string | null>(null);
  const [sdgOptions, setSdgOptions] = useState<SdgOption[]>([]);
  const [sdgRows, setSdgRows] = useState<SdgDraft[]>(defaults?.sdgs ?? []);
  const [challengeOptions, setChallengeOptions] = useState<ChallengeOption[]>([]);
  const [challengeIds, setChallengeIds] = useState<string[]>(defaults?.challenge_ids ?? []);
  const [sources, setSources] = useState<SourceOption[]>([]);

  useEffect(() => {
    const load = (url: string, apply: (data: Record<string, unknown>) => void) =>
      fetch(url)
        .then((response) => response.json())
        .then(apply)
        .catch(() => undefined);
    load('/api/taxonomies/activity-formats', (data) => setFormatOptions((data.activity_formats as ValueChoice[]) ?? []));
    load('/api/taxonomies/activity-focuses', (data) => setFocusOptions((data.activity_focuses as ValueChoice[]) ?? []));
    load('/api/taxonomies/educational-goals', (data) => setGoals((data.educational_goals as PickerGoal[]) ?? []));
    load('/api/taxonomies/sdgs', (data) => setSdgOptions((data.sdgs as SdgOption[]) ?? []));
    load('/api/taxonomies/challenges', (data) => setChallengeOptions((data.challenges as ChallengeOption[]) ?? []));
    load('/api/taxonomies/activity-sources', (data) => setSources((data.activity_sources as SourceOption[]) ?? []));
  }, []);

  /** Changing the divisions drops the objectives of divisions that were removed, and says which. */
  function setAgeGroups(next: string[]) {
    setAgeGroupsState(next);
    const { kept, removedCodes } = pruneObjectives(
      objectives,
      next,
      (goalId) => goals.find((goal) => goal.id === goalId)?.code ?? goalId
    );
    if (removedCodes.length > 0) {
      setObjectives(kept);
      setRemovedNotice(t('activityEditor.objectivesRemoved', { codes: removedCodes.join(', ') }));
    } else {
      setRemovedNotice(null);
    }
  }

  function setDivisionGoals(division: string, ids: string[]) {
    setObjectives((current) => {
      const others = current.filter((row) => row.age_group !== division);
      const own = ids.map((goal_id) => current.find((row) => row.goal_id === goal_id && row.age_group === division) ?? { goal_id, age_group: division, behaviour: '' });
      return [...others, ...own];
    });
  }

  function setBehaviour(division: string, goalId: string, behaviour: string) {
    setObjectives((current) =>
      current.map((row) => (row.goal_id === goalId && row.age_group === division ? { ...row, behaviour } : row))
    );
  }

  function toggleSdg(id: string) {
    setSdgRows((rows) => (rows.some((row) => row.sdg_id === id) ? rows.filter((row) => row.sdg_id !== id) : [...rows, { sdg_id: id, justification: '' }]));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    if (!groupSizes.length || !locations.length || !ageGroups.length) {
      setError('Escolha pelo menos um valor em tamanho do grupo, local e secção.');
      setStep('basics');
      setBusy(false);
      return;
    }
    if (!formatId || !focusId) {
      setError(t('activityEditor.formatFocusRequired'));
      setStep('basics');
      setBusy(false);
      return;
    }
    if (secondaryFocusId && secondaryFocusId === focusId) {
      setError(t('activityEditor.secondaryDiffers'));
      setStep('basics');
      setBusy(false);
      return;
    }
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(form.entries());
    body.approximate_duration_minutes = Number(body.approximate_duration_minutes);
    body.group_sizes = groupSizes;
    body.locations = locations;
    body.age_groups = ageGroups;
    body.format_id = formatId;
    body.focus_id = focusId;
    body.secondary_focus_id = secondaryFocusId || null;
    body.duration_min_minutes = body.duration_min_minutes === '' ? null : Number(body.duration_min_minutes);
    body.duration_max_minutes = body.duration_max_minutes === '' ? null : Number(body.duration_max_minutes);
    body.objectives = objectives.map((row) => ({ goal_id: row.goal_id, age_group: row.age_group, behaviour: row.behaviour.trim() || null }));
    body.sdgs = sdgRows.map((row) => ({ sdg_id: row.sdg_id, justification: row.justification.trim() || null }));
    body.challenge_ids = challengeIds;
    const response = await fetch(action, {
      method: defaults?.name ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(detail?.error?.message ?? 'Não foi possível guardar a atividade.');
      setBusy(false);
      return;
    }
    window.location.href = redirectTo;
  }

  const stepIndex = STEPS.indexOf(step);
  const hidden = (name: Step) => name !== step;

  return (
    <form className="max-w-2xl space-y-6" onSubmit={onSubmit}>
      <nav aria-label="Passos" className="flex flex-wrap gap-2">
        {STEPS.map((name) => (
          <Button
            key={name}
            type="button"
            variant={name === step ? 'default' : 'outline'}
            size="sm"
            aria-current={name === step ? 'step' : undefined}
            onClick={() => setStep(name)}
          >
            {STEP_LABELS[name]}
          </Button>
        ))}
      </nav>

      {/* All steps stay in the DOM (hidden) so the browser keeps every field value. */}
      <section hidden={hidden('basics')} className="space-y-4" aria-label={STEP_LABELS.basics}>
        <Field name="name" label="Nome" defaultValue={defaults?.name} />
        <Field name="description" label="Descrição" defaultValue={defaults?.description} />
        <Field name="materials" label="Materiais" defaultValue={defaults?.materials} />
        <Field name="approximate_duration_minutes" label="Duração (min)" type="number" defaultValue={defaults?.approximate_duration_minutes} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="duration_min_minutes" label={t('activityEditor.durationMin')} type="number" required={false} defaultValue={defaults?.duration_min_minutes ?? undefined} />
          <Field name="duration_max_minutes" label={t('activityEditor.durationMax')} type="number" required={false} defaultValue={defaults?.duration_max_minutes ?? undefined} />
        </div>
        <CheckboxGroup
          legend="Grupo"
          name="group_sizes"
          options={GROUP_SIZE_VALUES.map((value) => ({ value, label: enumLabel(t, 'groupSize', value) }))}
          selected={groupSizes}
          onChange={setGroupSizes}
        />
        <Field name="effort_level" label="Esforço" defaultValue={defaults?.effort_level ?? 'medium'} />
        <CheckboxGroup
          legend="Local"
          name="locations"
          options={LOCATION_VALUES.map((value) => ({ value, label: enumLabel(t, 'location', value) }))}
          selected={locations}
          onChange={setLocations}
        />
        <CheckboxGroup
          legend="Secção"
          name="age_groups"
          options={AGE_GROUP_VALUES.map((value) => ({ value, label: enumLabel(t, 'ageGroup', value) }))}
          selected={ageGroups}
          onChange={setAgeGroups}
        />
        <ValueSelect id="format_id" label={t('activityEditor.format')} options={formatOptions} value={formatId} onChange={setFormatId} required noneLabel={t('activityEditor.choose')} />
        <ValueSelect id="focus_id" label={t('activityEditor.focus')} options={focusOptions} value={focusId} onChange={setFocusId} required noneLabel={t('activityEditor.choose')} />
        <ValueSelect
          id="secondary_focus_id"
          label={t('activityEditor.secondaryFocus')}
          options={focusOptions.filter((option) => option.id !== focusId)}
          value={secondaryFocusId}
          onChange={setSecondaryFocusId}
          noneLabel={t('activityEditor.noSecondary')}
        />
        <div className="space-y-1">
          <Label htmlFor="source_id">Fonte</Label>
          <select
            id="source_id"
            name="source_id"
            defaultValue={defaults?.source_id ?? ''}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Sem fonte</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
        <Field name="source_url" label="Ligação à fonte (HTTPS)" defaultValue={defaults?.source_url ?? ''} required={false} />
        <div className="space-y-1">
          <Label htmlFor="image_url">URL da imagem (HTTPS)</Label>
          <Input id="image_url" name="image_url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          <div className="space-y-1">
            <Label htmlFor="image_file">Carregar imagem</Label>
            <input
              id="image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={handleImageFile}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2"
            />
            <p className="text-xs text-muted-foreground">
              {uploading ? 'A carregar…' : 'JPEG, PNG ou WebP, até 5 MB.'}
            </p>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Pré-visualização da imagem" className="mt-2 h-32 w-auto rounded-md border object-cover" />
            ) : null}
          </div>
        </div>
      </section>

      <section hidden={hidden('instructions')} className="space-y-2" aria-label={STEP_LABELS.instructions}>
        <Label htmlFor="instructions">Instruções</Label>
        <p className="text-sm text-muted-foreground">
          Use os títulos Preparação, Desenvolvimento e Fecho e debriefing, cada um numa linha, e numere os passos (1. 2. 3.).
        </p>
        <Textarea id="instructions" name="instructions" rows={14} defaultValue={defaults?.instructions ?? ''} placeholder={INSTRUCTIONS_TEMPLATE} />
      </section>

      <section hidden={hidden('safety')} className="space-y-4" aria-label={STEP_LABELS.safety}>
        <p className="text-sm text-muted-foreground">
          Descreva o que pode correr mal e como reduzir o risco. Se ficar em branco, a página da atividade avisa que a análise ainda não está disponível.
        </p>
        <RiskFields prefix="physical" title="Risco físico" defaults={defaults} />
        <RiskFields prefix="psychological" title="Risco psicológico" defaults={defaults} />
      </section>

      <section hidden={hidden('objectives')} className="space-y-6" aria-label={STEP_LABELS.objectives}>
        {ageGroups.length === 0 && <p className="text-sm text-muted-foreground">{t('activityEditor.objectivesHint')}</p>}
        {ageGroups.includes('leaders') && (
          <p className="text-sm text-muted-foreground">{t('activityEditor.leadersNoObjectives')}</p>
        )}
        {AGE_GROUP_VALUES.filter((division) => division !== 'leaders' && ageGroups.includes(division)).map((division) => {
          const rows = objectives.filter((row) => row.age_group === division);
          return (
            <div key={division} className="space-y-3 rounded-lg border p-4" data-testid={`objectives-${division}`}>
              <h3 className="font-bold">{enumLabel(t, 'ageGroup', division)}</h3>
              <ObjectivePicker
                goals={goals}
                ageGroups={[division]}
                selected={rows.map((row) => row.goal_id)}
                onChange={(ids) => setDivisionGoals(division, ids)}
              />
              {rows.map((row) => {
                const goal = goals.find((item) => item.id === row.goal_id);
                return (
                  <div key={row.goal_id} className="space-y-1">
                    <Label htmlFor={`behaviour-${division}-${row.goal_id}`}>
                      Como observar {goal?.code ?? ''}
                    </Label>
                    <Textarea
                      id={`behaviour-${division}-${row.goal_id}`}
                      rows={2}
                      value={row.behaviour}
                      onChange={(event) => setBehaviour(division, row.goal_id, event.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
        {removedNotice ? (
          <p role="status" className="text-sm text-muted-foreground">
            {removedNotice}
          </p>
        ) : null}
      </section>

      <section hidden={hidden('sdgs')} className="space-y-4" aria-label={STEP_LABELS.sdgs}>
        <fieldset className="space-y-1">
          <legend className="text-sm font-bold">ODS</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {sdgOptions.map((sdg) => (
              <label key={sdg.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sdgRows.some((row) => row.sdg_id === sdg.id)} onChange={() => toggleSdg(sdg.id)} />
                {sdg.number}. {sdg.name}
              </label>
            ))}
          </div>
        </fieldset>
        {sdgRows.map((row) => {
          const sdg = sdgOptions.find((item) => item.id === row.sdg_id);
          return (
            <div key={row.sdg_id} className="space-y-1">
              <Label htmlFor={`sdg-${row.sdg_id}`}>Porquê o ODS {sdg?.number}</Label>
              <Textarea
                id={`sdg-${row.sdg_id}`}
                rows={2}
                value={row.justification}
                onChange={(event) =>
                  setSdgRows((rows) => rows.map((item) => (item.sdg_id === row.sdg_id ? { ...item, justification: event.target.value } : item)))
                }
              />
            </div>
          );
        })}
      </section>

      <section hidden={hidden('challenges')} className="space-y-4" aria-label={STEP_LABELS.challenges}>
        {[...new Set(challengeOptions.map((challenge) => challenge.type.name))].map((type) => (
          <fieldset key={type} className="space-y-1">
            <legend className="text-sm font-bold text-primary">{type}</legend>
            {challengeOptions
              .filter((challenge) => challenge.type.name === type)
              .map((challenge) => (
                <label key={challenge.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={challengeIds.includes(challenge.id)}
                    onChange={() =>
                      setChallengeIds((ids) => (ids.includes(challenge.id) ? ids.filter((id) => id !== challenge.id) : [...ids, challenge.id]))
                    }
                  />
                  <span>
                    <span className="mr-1 font-bold">{challenge.code}</span>
                    <span className="mr-1 text-muted-foreground">({enumLabel(t, 'ageGroup', challenge.age_group)})</span>
                    {challenge.short_title || challenge.title}
                  </span>
                </label>
              ))}
          </fieldset>
        ))}
      </section>

      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={stepIndex === 0} onClick={() => setStep(STEPS[stepIndex - 1]!)}>
          Anterior
        </Button>
        <Button type="button" variant="outline" disabled={stepIndex === STEPS.length - 1} onClick={() => setStep(STEPS[stepIndex + 1]!)}>
          Seguinte
        </Button>
        <Button type="submit" disabled={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function RiskFields({
  prefix,
  title,
  defaults,
}: {
  prefix: 'physical' | 'psychological';
  title: string;
  defaults?: Record<string, unknown>;
}) {
  const value = (suffix: string) => String(defaults?.[`${prefix}_${suffix}`] ?? '');
  return (
    <fieldset className="space-y-2 rounded-lg border p-4">
      <legend className="px-1 font-bold">{title}</legend>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_risk_level`}>Nível</Label>
        <select
          id={`${prefix}_risk_level`}
          name={`${prefix}_risk_level`}
          defaultValue={value('risk_level')}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {RISK_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_risk`}>O que pode correr mal</Label>
        <Textarea id={`${prefix}_risk`} name={`${prefix}_risk`} rows={3} defaultValue={value('risk')} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_mitigation`}>Como reduzir</Label>
        <Textarea id={`${prefix}_mitigation`} name={`${prefix}_mitigation`} rows={3} defaultValue={value('mitigation')} />
      </div>
    </fieldset>
  );
}

type ValueChoice = { id: string; name: string; description?: string | null };

/** A single choice (format or focus) with the description of the chosen value as help text. */
function ValueSelect({
  id,
  label,
  options,
  value,
  onChange,
  noneLabel,
  required = false,
}: {
  id: string;
  label: string;
  options: ValueChoice[];
  value: string;
  onChange: (next: string) => void;
  noneLabel: string;
  required?: boolean;
}) {
  const chosen = options.find((option) => option.id === value);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-describedby={chosen?.description ? `${id}-help` : undefined}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">{noneLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {chosen?.description && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {chosen.description}
        </p>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = 'text',
  required = true,
  multiline = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      {multiline ? (
        <Textarea id={name} name={name} rows={6} defaultValue={defaultValue} required={required} />
      ) : (
        <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
      )}
    </div>
  );
}

/** A required multi-select: one checkbox per option, at least one must stay selected on submit. */
function CheckboxGroup({
  legend,
  name,
  options,
  selected,
  onChange,
}: {
  legend: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }
  return (
    <fieldset className="space-y-1" data-testid={`field-${name}`}>
      <legend className="text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
