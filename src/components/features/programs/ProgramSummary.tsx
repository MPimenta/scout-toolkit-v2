'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, Globe, Users, Activity } from 'lucide-react';
import { IconDisplay } from '@/components/ui/IconDisplay';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

interface ProgramSummaryProps {
  entries: ProgramEntry[];
  activities: ActivitiesResponse['activities'];
  programStartTime: string;
  totalDuration: number;
}

export function ProgramSummary({ 
  entries, 
  activities, 
  programStartTime, 
  totalDuration 
}: ProgramSummaryProps) {
  // Calculate summary statistics
  const activityCount = entries.filter(entry => entry.entry_type === 'activity').length;
  const customBlockCount = entries.filter(entry => entry.entry_type === 'custom').length;
  
  // Get all educational goals from activities
  const allEducationalGoals = new Map();
  const allSDGs = new Map();
  const allGroupSizes = new Set<string>();
  const allEffortLevels = new Set<string>();
  const allLocations = new Set<string>();
  const allAgeGroups = new Set<string>();

  entries.forEach(entry => {
    if (entry.entry_type === 'activity' && entry.activity_id) {
      const activity = activities.find(a => a.id === entry.activity_id);
      if (activity) {
        // Collect educational goals
        activity.educational_goals?.forEach(goal => {
          allEducationalGoals.set(goal.id, goal);
        });

        // Collect SDGs
        activity.sdgs?.forEach(sdg => {
          allSDGs.set(sdg.id, sdg);
        });

        // Collect other properties
        if (activity.group_size) allGroupSizes.add(activity.group_size);
        if (activity.effort_level) allEffortLevels.add(activity.effort_level);
        if (activity.location) allLocations.add(activity.location);
        if (activity.age_group) allAgeGroups.add(activity.age_group);
      }
    }
  });

  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Program Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Resumo do Programa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Duração Total: {hours}h {minutes}min</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{activityCount} Atividades, {customBlockCount} Blocos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Início:</span>
            <span>{programStartTime}</span>
          </div>
        </CardContent>
      </Card>

      {/* Educational Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objetivos Educativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allEducationalGoals.size > 0 ? (
            <div className="flex flex-wrap gap-1">
              {Array.from(allEducationalGoals.values()).map(goal => (
                <Badge key={goal.id} variant="secondary" className="text-xs">
                  <IconDisplay 
                    icon={goal.icon || '🎯'} 
                    text={goal.title}
                    className="gap-1"
                    iconClassName="text-xs"
                    textClassName="text-xs"
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum objetivo educativo</p>
          )}
        </CardContent>
      </Card>

      {/* SDGs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            ODS (Objetivos de Desenvolvimento Sustentável)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allSDGs.size > 0 ? (
            <div className="flex flex-wrap gap-1">
              {Array.from(allSDGs.values()).map(sdg => (
                <Badge key={sdg.id} variant="outline" className="text-xs">
                  <IconDisplay 
                    icon={sdg.icon || '🌱'} 
                    text={`${sdg.number}`}
                    className="gap-1"
                    iconClassName="text-xs"
                    textClassName="text-xs"
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum ODS</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Properties Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Propriedades das Atividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Group Sizes */}
          {allGroupSizes.size > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Tamanhos de Grupo:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(allGroupSizes).map(size => (
                  <Badge key={size} variant="outline" className="text-xs">
                    {size}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Effort Levels */}
          {allEffortLevels.size > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Níveis de Esforço:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(allEffortLevels).map(level => (
                  <Badge key={level} variant="outline" className="text-xs">
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {allLocations.size > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Locais:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(allLocations).map(location => (
                  <Badge key={location} variant="outline" className="text-xs">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Age Groups */}
          {allAgeGroups.size > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Faixas Etárias:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(allAgeGroups).map(ageGroup => (
                  <Badge key={ageGroup} variant="outline" className="text-xs">
                    {ageGroup}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
