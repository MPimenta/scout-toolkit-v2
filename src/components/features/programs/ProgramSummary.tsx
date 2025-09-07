'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, Globe, Users, Activity } from 'lucide-react';
import { IconDisplay } from '@/components/ui/IconDisplay';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

/**
 * Props for the ProgramSummary component
 */
interface ProgramSummaryProps {
  entries: ProgramEntry[];
  activities: ActivitiesResponse['activities'];
  programStartTime: string;
  totalDuration: number;
}

/**
 * ProgramSummary component for displaying program statistics and overview
 * Shows activity counts, educational goals, SDGs, and other program metrics
 * @param entries - Array of program entries to analyze
 * @param activities - Array of available activities for reference
 * @param programStartTime - The start time of the program
 * @param totalDuration - Total duration of the program in minutes
 * @returns JSX element representing the program summary
 */
export function ProgramSummary({ 
  entries, 
  activities, 
  programStartTime, 
  totalDuration 
}: ProgramSummaryProps) {
  // Calculate summary statistics
  const activityCount = entries.filter(entry => entry.entry_type === 'activity').length;
  const customBlockCount = entries.filter(entry => entry.entry_type === 'custom').length;
  
  // Get all educational goals and SDGs from activities
  const allEducationalGoals = new Map();
  const allSDGs = new Map();

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
                  <div className="flex items-center gap-1">
                    {sdg.icon_url ? (
                      <img
                        src={sdg.icon_url}
                        alt={`SDG ${sdg.number}`}
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <span className="text-xs">🌱</span>
                    )}
                    <span>{sdg.number}</span>
                  </div>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum ODS</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
