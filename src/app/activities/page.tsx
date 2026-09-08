'use client';

import { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from '@/components/features/activities/ActivityCard';
import { ActivitiesTable } from '@/components/features/activities/ActivitiesTable';
import { ViewToggle, ViewMode } from '@/components/features/activities/ViewToggle';
import { ActivityFilters, FilterState } from '@/components/features/activities/ActivityFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';

/**
 * ActivitiesPage component for displaying and managing activities
 * Provides filtering, searching, and viewing capabilities for activities
 * @returns JSX element representing the activities page
 */
export default function ActivitiesPage() {
  const { t } = useLocale();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    groupSize: [],
    effortLevel: [],
    location: '',
    ageGroup: [],
    activityType: [],
    sdgs: [],
    educationalGoals: [],
    challenges: [],
    durationMin: '',
    durationMax: '',
    durationOperator: '>=',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');

  const { activities, pagination, filterInfo, loading, error, refresh } = useActivities({
    filters,
    page: 1,
    limit: 20,
    sort: 'name',
    order: 'asc',
  });

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      groupSize: [],
      effortLevel: [],
      location: '',
      ageGroup: [],
      activityType: [],
      sdgs: [],
      educationalGoals: [],
      challenges: [],
      durationMin: '',
      durationMax: '',
      durationOperator: '>=',
    };
    setFilters(clearedFilters);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('activities.title')}</h1>
          <p className="text-muted-foreground">
            {t('activities.lead')}
          </p>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {t('activities.errorTitle')}
            </CardTitle>
            <CardDescription>
              {t('activities.errorLead')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('common.errorDetails', { error })}
            </p>
            <Button 
              onClick={refresh} 
              variant="outline"
            >
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-3xl font-bold">{t('activities.title')}</h1>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href="/atividades/propor">{t('activities.propose')}</a>
            </Button>
            <Button asChild variant="ghost">
              <a href="/atividades/minhas">{t('activities.mine')}</a>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-4">
          {t('activities.lead')}
        </p>
      </div>

      {/* Filters Component */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        availableFilters={filterInfo?.available || {
          group_sizes: [],
          effort_levels: [],
          locations: [],
          age_groups: [],
          activity_types: [],
        }}
      />

      {/* Results Count and Active Filters Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading
              ? t('common.loading')
              : (pagination?.total || 0) === 1
                ? t('activities.foundOne')
                : t('activities.foundMany', { count: pagination?.total || 0 })}
          </p>
          
          <div className="flex items-center gap-4">
            {/* Quick filter summary */}
            {Object.values(filters).some(value => 
              Array.isArray(value) ? value.length > 0 : value !== '' && value !== '>='
            ) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>{t('activities.filtersActive')}</span>
              </div>
            )}
            
            {/* View Toggle */}
            <ViewToggle 
              currentView={viewMode} 
              onViewChange={setViewMode} 
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('activities.loading')}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && activities.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('activities.emptyTitle')}</CardTitle>
            <CardDescription>
              {t('activities.emptyLead')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t('activities.emptyHint')}
            </p>
            <Button 
              onClick={handleClearFilters} 
              variant="outline"
            >
              {t('common.clearFilters')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activities Display - Conditional based on view mode */}
      {!loading && activities.length > 0 && (
        <>
          {viewMode === 'tiles' ? (
            /* Activities Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            /* Activities Table */
            <ActivitiesTable 
              activities={activities}
              onViewActivity={(activity) => {
                window.location.href = `/activities/${activity.id}`;
              }}
            />
          )}
        </>
      )}

      {/* Pagination (Future Story 3.3) */}
      {!loading && pagination?.total_pages && pagination.total_pages > 1 && (
        <div className="mt-8 flex justify-center">
          <p className="text-sm text-muted-foreground">
            Paginação será implementada em Story 3.3: Table View
          </p>
        </div>
      )}

      {/* Development Notice */}
      {!loading && activities.length > 0 && (
        <div className="mt-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Funcionalidade em Desenvolvimento</CardTitle>
              <CardDescription className="text-xs">
                Esta é a implementação da página de atividades com filtros avançados e visualização em tabela. Funcionalidades adicionais serão adicionadas em breve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Funcionalidades implementadas: filtros avançados (Story 3.2), visualização em tabela (Story 3.3), páginas de detalhes (Story 3.4). Próximas: sistema de avaliações e programa construtor.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

