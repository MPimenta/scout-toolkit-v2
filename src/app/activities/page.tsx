'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from '@/components/features/activities/ActivityCard';
import { ActivitiesTable } from '@/components/features/activities/ActivitiesTable';
import { ViewToggle, ViewMode } from '@/components/features/activities/ViewToggle';
import { ActivityFilters, FilterState } from '@/components/features/activities/ActivityFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { log } from '@/lib/errors';

/**
 * ActivitiesPage component for displaying and managing activities
 * Provides filtering, searching, and viewing capabilities for activities
 * @returns JSX element representing the activities page
 */
export default function ActivitiesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    groupSize: [],
    effortLevel: [],
    location: '',
    ageGroup: [],
    activityType: [],
    sdgs: [],
    educationalGoals: [],
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
          <h1 className="text-3xl font-bold mb-4">Atividades</h1>
          <p className="text-muted-foreground">
            Explore centenas de atividades para todas as idades e objetivos educativos.
          </p>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Erro ao Carregar Atividades
            </CardTitle>
            <CardDescription>
              Ocorreu um erro ao tentar carregar as atividades. Por favor, tenta novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detalhes do erro: {error}
            </p>
            <Button 
              onClick={refresh} 
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Atividades</h1>
        <p className="text-muted-foreground">
          Explore centenas de atividades para todas as idades e objetivos educativos.
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
            {loading ? 'A carregar...' : `${pagination?.total || 0} atividade${(pagination?.total || 0) !== 1 ? 's' : ''} encontrada${(pagination?.total || 0) !== 1 ? 's' : ''}`}
          </p>
          
          <div className="flex items-center gap-4">
            {/* Quick filter summary */}
            {Object.values(filters).some(value => 
              Array.isArray(value) ? value.length > 0 : value !== '' && value !== '>='
            ) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filtros ativos</span>
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
            <p className="text-muted-foreground">A carregar atividades...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && activities.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Atividade Encontrada</CardTitle>
            <CardDescription>
              Não foram encontradas atividades com os critérios de pesquisa atuais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tenta ajustar os filtros de pesquisa ou contacta um administrador se acreditas que deveria haver atividades disponíveis.
            </p>
            <Button 
              onClick={handleClearFilters} 
              variant="outline"
            >
              Limpar Filtros
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
                // Navigate to activity details page
                window.location.href = `/activities/${activity.id}`;
              }}
              onEditActivity={(activity) => {
                // Navigate to edit activity page (admin only)
                router.push(`/admin/activities/${activity.id}/edit`);
              }}
              onDeleteActivity={(activity) => {
                // Implement delete confirmation dialog
                if (confirm(`Tem certeza que deseja eliminar a atividade "${activity.name}"?`)) {
                  // Note: Delete functionality will be implemented in a future story
                  log.info('Delete activity requested', { activityId: activity.id });
                }
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

