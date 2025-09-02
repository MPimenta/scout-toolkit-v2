'use client';

import { useActivity } from '@/hooks/useActivity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Target, MapPin, BookOpen, Star, MessageSquare, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActivityRating } from './ActivityRating';
import { AddToProgramModal } from './AddToProgramModal';
import { useState } from 'react';

interface ActivityDetailProps {
  activityId: string;
}

// Helper function to get Portuguese text from multilingual content
function getPortugueseText(content: Record<string, string> | null | undefined): string {
  if (!content) return '';
  return content.pt || content.en || Object.values(content)[0] || '';
}

// Helper function to get age group display text
function getAgeGroupText(ageGroup: string): string {
  const ageMap = {
    cub_scouts: 'Lobitos (6-10)',
    scouts: 'Escoteiros (10-14)',
    adventurers: 'Exploradores (14-17)',
    rovers: 'Caminheiros (17-21)',
    leaders: 'Dirigentes (21+)',
  };
  return ageMap[ageGroup as keyof typeof ageMap] || ageGroup;
}

// Helper function to get group size display text
function getGroupSizeText(groupSize: string): string {
  const sizeMap = {
    small: 'Pequeno (2-5)',
    medium: 'Médio (6-15)',
    large: 'Grande (16+)',
  };
  return sizeMap[groupSize as keyof typeof sizeMap] || groupSize;
}

// Helper function to get effort level display text
function getEffortLevelText(effortLevel: string): string {
  const effortMap = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
  };
  return effortMap[effortLevel as keyof typeof effortMap] || effortLevel;
}

// Helper function to get location display text
function getLocationText(location: string): string {
  const locationMap = {
    inside: 'Interior',
    outside: 'Exterior',
  };
  return locationMap[location as keyof typeof locationMap] || location;
}

export function ActivityDetail({ activityId }: ActivityDetailProps) {
  const { activity, loading, error } = useActivity(activityId);
  const [showAddToProgramModal, setShowAddToProgramModal] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar atividade</h1>
        <p className="text-muted-foreground">{error || 'Atividade não encontrada'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Activity Image */}
        <div className="lg:w-1/3">
          {activity.image_url ? (
            <img
              src={activity.image_url}
              alt={getPortugueseText(activity.name)}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Activity Info */}
        <div className="lg:w-2/3 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {getPortugueseText(activity.name)}
            </h1>
            <p className="text-lg text-muted-foreground">
              {getPortugueseText(activity.description)}
            </p>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {activity.approximate_duration_minutes} min
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {getGroupSizeText(activity.group_size)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {getEffortLevelText(activity.effort_level)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {getLocationText(activity.location)}
            </Badge>
            <Badge variant="secondary">
              {getAgeGroupText(activity.age_group)}
            </Badge>
            {activity.activity_type && (
              <Badge variant="outline">
                {getPortugueseText(activity.activity_type.name)}
              </Badge>
            )}
          </div>

          {/* Add to Program Button */}
          <Button 
            onClick={() => setShowAddToProgramModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar ao Programa
          </Button>
        </div>
      </div>

      <Separator />

      {/* Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Materiais Necessários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {getPortugueseText(activity.materials)}
          </p>
        </CardContent>
      </Card>

      {/* Educational Goals Section */}
      {activity.educational_goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objetivos Educativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {activity.educational_goals.map((goal) => (
                <div key={goal.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {goal.area.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {getPortugueseText(goal.title)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {getPortugueseText(goal.area.name)} • {goal.area.code}
                      </p>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {getPortugueseText(goal.description)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SDGs Section */}
      {activity.sdgs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Objetivos de Desenvolvimento Sustentável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activity.sdgs.map((sdg) => (
                <div key={sdg.id} className="text-center p-3 border rounded-lg">
                  <img
                    src={sdg.icon_url}
                    alt={`SDG ${sdg.number}`}
                    className="w-16 h-16 mx-auto mb-2"
                  />
                  <h4 className="font-semibold text-sm text-foreground">
                    {sdg.number}. {getPortugueseText(sdg.name)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {getPortugueseText(sdg.description)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating and Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Avaliações e Comentários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityRating activityId={activityId} />
        </CardContent>
      </Card>

      {/* Add to Program Modal */}
      <AddToProgramModal
        isOpen={showAddToProgramModal}
        onClose={() => setShowAddToProgramModal(false)}
        activity={activity}
      />
    </div>
  );
}
