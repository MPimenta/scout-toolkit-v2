'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Target,
  Globe,
  BookOpen
} from 'lucide-react';

export interface FilterState {
  search: string;
  groupSize: string[];
  effortLevel: string[];
  location: string;
  ageGroup: string[];
  activityType: string[];
  sdgs: string[];
  educationalGoals: string[];
  durationMin: string;
  durationMax: string;
  durationOperator: string;
}

interface ActivityFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  availableFilters?: {
    group_sizes: string[];
    effort_levels: string[];
    locations: string[];
    age_groups: string[];
    activity_types: string[];
  };
}

// Real data will be fetched from API

const GROUP_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeno (2-6)' },
  { value: 'medium', label: 'Médio (7-15)' },
  { value: 'large', label: 'Grande (16+)' },
];

const EFFORT_LEVEL_OPTIONS = [
  { value: 'low', label: 'Baixo' },
  { value: 'medium', label: 'Médio' },
  { value: 'high', label: 'Alto' },
];

const LOCATION_OPTIONS = [
  { value: 'inside', label: 'Interior' },
  { value: 'outside', label: 'Exterior' },
];

const AGE_GROUP_OPTIONS = [
  { value: 'cub_scouts', label: 'Lobitos (6-10)' },
  { value: 'scouts', label: 'Escoteiros (10-14)' },
  { value: 'adventurers', label: 'Exploradores (14-17)' },
  { value: 'rovers', label: 'Caminheiros (17-21)' },
  { value: 'leaders', label: 'Dirigentes (21+)' },
];

const DURATION_OPERATORS = [
  { value: '>=', label: 'Mínimo' },
  { value: '<=', label: 'Máximo' },
  { value: '=', label: 'Exato' },
];

export function ActivityFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  availableFilters 
}: ActivityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [activityTypeOptions, setActivityTypeOptions] = useState<any[]>([]);
  const [sdgOptions, setSdgOptions] = useState<any[]>([]);
  const [educationalGoalOptions, setEducationalGoalOptions] = useState<any[]>([]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch activity types
        const activityTypesResponse = await fetch('/api/taxonomies/activity-types');
        if (activityTypesResponse.ok) {
          const activityTypesData = await activityTypesResponse.json();
          setActivityTypeOptions(activityTypesData.activity_types || []);
        }

        // Fetch SDGs
        const sdgsResponse = await fetch('/api/taxonomies/sdgs');
        if (sdgsResponse.ok) {
          const sdgsData = await sdgsResponse.json();
          setSdgOptions(sdgsData.sdgs || []);
        }

        // Fetch educational goals
        const goalsResponse = await fetch('/api/taxonomies/educational-goals');
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          setEducationalGoalOptions(goalsData.educational_goals || []);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (key: keyof FilterState, value: string, checked: boolean) => {
    const currentValues = localFilters[key] as string[];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleFilterChange(key, newValues);
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
    
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== '' && value !== '>='
  );

  const getPortugueseText = (text: Record<string, string> | string) => {
    if (typeof text === 'string') return text;
    return text.pt || text.en || Object.values(text)[0] || '';
  };

  return (
    <>
      {/* Active Filters Display - Always Visible */}
      {hasActiveFilters && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-primary">Filtros Ativos</label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-primary hover:text-primary/80"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar Todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  Pesquisa: {filters.search}
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.groupSize.map((size) => (
                <Badge key={size} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  Grupo: {GROUP_SIZE_OPTIONS.find(o => o.value === size)?.label}
                  <button
                    onClick={() => handleMultiSelectChange('groupSize', size, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.effortLevel.map((level) => (
                <Badge key={level} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  Esforço: {EFFORT_LEVEL_OPTIONS.find(o => o.value === level)?.label}
                  <button
                    onClick={() => handleMultiSelectChange('effortLevel', level, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.location && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  Local: {LOCATION_OPTIONS.find(o => o.value === filters.location)?.label}
                  <button
                    onClick={() => handleFilterChange('location', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.ageGroup.map((age) => (
                <Badge key={age} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  Idade: {AGE_GROUP_OPTIONS.find(o => o.value === age)?.label}
                  <button
                    onClick={() => handleMultiSelectChange('ageGroup', age, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

                             {filters.activityType.map((typeId) => (
                 <Badge key={typeId} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                   Tipo: {getPortugueseText(activityTypeOptions.find(o => o.id === typeId)?.name || '')}
                   <button
                     onClick={() => handleMultiSelectChange('activityType', typeId, false)}
                     className="ml-1 hover:text-destructive"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}

               {filters.sdgs.map((sdgId) => (
                 <Badge key={sdgId} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                   ODS {sdgOptions.find(o => o.id === sdgId)?.number}: {getPortugueseText(sdgOptions.find(o => o.id === sdgId)?.name || '')}
                   <button
                     onClick={() => handleMultiSelectChange('sdgs', sdgId, false)}
                     className="ml-1 hover:text-destructive"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}

               {filters.educationalGoals.map((goalId) => (
                 <Badge key={goalId} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                   {getPortugueseText(educationalGoalOptions.find(o => o.id === goalId)?.title || '')}
                   <button
                     onClick={() => handleMultiSelectChange('educationalGoals', goalId, false)}
                     className="ml-1 hover:text-destructive"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}
              
              {(filters.durationMin || filters.durationMax) && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  Duração: {filters.durationMin || '0'} - {filters.durationMax || '∞'} min
                  <button
                    onClick={() => {
                      handleFilterChange('durationMin', '');
                      handleFilterChange('durationMax', '');
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Filters Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtros de Atividades
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar Filtros
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Recolher filtros avançados" : "Expandir filtros avançados"}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span className="ml-1">Recolher</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span className="ml-1">Expandir</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar atividades por nome, descrição ou materiais..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* All Other Filters (Expanded) */}
          {isExpanded && (
            <div className="space-y-6 pt-4 border-t">
              {/* Basic Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Group Size */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tamanho do Grupo</label>
                  <div className="space-y-2">
                    {GROUP_SIZE_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.groupSize.includes(option.value)}
                          onChange={(e) => handleMultiSelectChange('groupSize', option.value, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Effort Level */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Nível de Esforço</label>
                  <div className="space-y-2">
                    {EFFORT_LEVEL_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.effortLevel.includes(option.value)}
                          onChange={(e) => handleMultiSelectChange('effortLevel', option.value, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Localização</label>
                  <select
                    value={localFilters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Todas</option>
                    {LOCATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Faixa Etária</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {AGE_GROUP_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.ageGroup.includes(option.value)}
                          onChange={(e) => handleMultiSelectChange('ageGroup', option.value, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Type Filter */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Tipo de Atividade
                </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {activityTypeOptions.map((option) => (
                     <label key={option.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={localFilters.activityType.includes(option.id)}
                         onChange={(e) => handleMultiSelectChange('activityType', option.id, e.target.checked)}
                         className="rounded border-gray-300"
                       />
                       <span className="text-sm">{getPortugueseText(option.name)}</span>
                     </label>
                   ))}
                 </div>
              </div>

              {/* Duration Filters */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duração (minutos)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Operador</label>
                    <select
                      value={localFilters.durationOperator}
                      onChange={(e) => handleFilterChange('durationOperator', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {DURATION_OPERATORS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Valor Mínimo</label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={localFilters.durationMin}
                      onChange={(e) => handleFilterChange('durationMin', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Valor Máximo</label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={localFilters.durationMax}
                      onChange={(e) => handleFilterChange('durationMax', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SDGs Filter */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Objetivos de Desenvolvimento Sustentável (ODS)
                </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                   {sdgOptions.map((option) => (
                     <label key={option.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={localFilters.sdgs.includes(option.id)}
                         onChange={(e) => handleMultiSelectChange('sdgs', option.id, e.target.checked)}
                         className="rounded border-gray-300"
                       />
                                               <div className="flex items-center gap-2">
                          {/* SDG Icon - Official UN SDG icon */}
                          {option.icon_url ? (
                            <img
                              src={option.icon_url}
                              alt={`ODS ${option.number}`}
                              className="w-6 h-6 object-contain"
                              title={`ODS ${option.number}: ${getPortugueseText(option.name)}`}
                            />
                          ) : (
                            // Fallback to colored circle if no icon
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                              style={{
                                backgroundColor: `hsl(${(option.number * 20) % 360}, 70%, 50%)`
                              }}
                              title={`ODS ${option.number}: ${getPortugueseText(option.name)}`}
                            >
                              {option.number}
                            </div>
                          )}
                          <span className="text-sm">
                            <strong>ODS {option.number}:</strong> {getPortugueseText(option.name)}
                          </span>
                        </div>
                     </label>
                   ))}
                 </div>
              </div>

              {/* Educational Goals Filter */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Objetivos Educativos
                </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                   {educationalGoalOptions.map((option) => (
                     <label key={option.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={localFilters.educationalGoals.includes(option.id)}
                         onChange={(e) => handleMultiSelectChange('educationalGoals', option.id, e.target.checked)}
                         className="rounded border-gray-300"
                       />
                       <span className="text-sm">
                         {getPortugueseText(option.title)}
                         <br />
                         <span className="text-xs text-muted-foreground">
                           {getPortugueseText(option.area.name)}
                         </span>
                       </span>
                     </label>
                   ))}
                 </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
