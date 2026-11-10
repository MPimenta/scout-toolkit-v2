'use client';

import { useEffect, useRef, useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from '@/components/features/activities/ActivityCard';
import { ActivitiesTable } from '@/components/features/activities/ActivitiesTable';
import { ViewToggle, ViewMode } from '@/components/features/activities/ViewToggle';
import { ActivityFilters } from '@/components/features/activities/ActivityFilters';
import { EMPTY_FILTERS, type FilterState } from '@/lib/activities/filters';
import { readCatalogueSession, writeCatalogueSession } from '@/lib/activities/catalogue-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { useTrackSearch } from '@/hooks/useUsageTracking';

/**
 * ActivitiesPage component for displaying and managing activities
 * Provides filtering, searching, and viewing capabilities for activities
 * @returns JSX element representing the activities page
 */
export default function ActivitiesPage() {
  const { t } = useLocale();
  const showProposals = useFeature('activity-proposals');
  const showTableView = useFeature('activities-table-view');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');
  const [page, setPage] = useState(1);

  // With the installed app there is no browser chrome, so keep the list as it was left while the
  // session lasts (filters, page, view). Restored after mount to match the server-rendered page.
  const keepSession = useFeature('pwa');
  const [sessionReady, setSessionReady] = useState(false);
  const restoredFilters = useRef<FilterState | null>(null);
  useEffect(() => {
    if (!keepSession) return;
    const saved = readCatalogueSession(window.sessionStorage);
    if (saved) {
      restoredFilters.current = saved.filters;
      setFilters(saved.filters);
      setPage(saved.page);
      setViewMode(saved.viewMode);
    }
    setSessionReady(true);
  }, [keepSession]);
  useEffect(() => {
    if (!keepSession || !sessionReady) return;
    writeCatalogueSession(window.sessionStorage, { filters, page, viewMode });
  }, [keepSession, sessionReady, filters, page, viewMode]);

  const { activities, pagination, filterInfo, loading, error, refresh } = useActivities({
    filters,
    page,
    limit: 20,
    sort: 'name',
    order: 'asc',
  });

  useTrackSearch(filters, pagination?.total, loading, restoredFilters.current);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
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
          {showProposals && (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <a href="/atividades/propor">{t('activities.propose')}</a>
              </Button>
              <Button asChild variant="ghost">
                <a href="/atividades/minhas">{t('activities.mine')}</a>
              </Button>
            </div>
          )}
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
        resultCount={pagination?.total}
        availableFilters={filterInfo?.available || {
          group_sizes: [],
          effort_levels: [],
          locations: [],
          age_groups: [],
        }}
      />

      {/* Results Count and Active Filters Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading
              ? '\u00a0'
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
            
            {showTableView && (
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-busy="true"
          aria-label={t('activities.loading')}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-56 rounded-lg border bg-muted/40 animate-pulse" />
          ))}
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
          {viewMode === 'tiles' || !showTableView ? (
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

      {!loading && pagination && pagination.total_pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label={t('activities.pageOf', { current: page, total: pagination.total_pages })}>
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('activities.pageOf', { current: page, total: pagination.total_pages })}
          </span>
          <Button
            variant="outline"
            disabled={page >= pagination.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </nav>
      )}

    </div>
  );
}

